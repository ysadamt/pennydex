'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box, MantineProvider } from '@mantine/core';
import { theme } from '../layout';

import {
  PennyMachine,
  MapComponentProps,
  COIN_ICON_SVG,
  X_ICON_SVG,
  ARROW_UP_RIGHT_ICON_SVG,
  PopupContent,
  HelpModal,
  MachineCounter,
} from './map';

export default function MapComponent({ machines, searchTerm, selectedStatuses, onMapLoaded }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const clusterMarkers = useRef<Map<number, maplibregl.Marker>>(new Map());
  const [filteredMachines, setFilteredMachines] = useState<PennyMachine[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [helpModalOpened, setHelpModalOpened] = useState(false);

  // Filter machines with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = machines;

      if (searchTerm) {
        filtered = filtered.filter(
          (machine) =>
            machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedStatuses.length > 0) {
        filtered = filtered.filter((machine) =>
          selectedStatuses.includes(machine.status)
        );
      } else {
        filtered = [];
      }

      setFilteredMachines(filtered);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [machines, searchTerm, selectedStatuses]);

  // Create popup with Mantine component
  const showPopup = useCallback((machine: PennyMachine, coordinates: [number, number]) => {
    if (!map.current || !popup.current) return;

    // Create a container div for the React component
    const container = document.createElement('div');
    const root = createRoot(container);

    // Use flushSync to render synchronously so content is ready before popup displays
    // Wrap with MantineProvider since this is rendered outside the main React tree
    flushSync(() => {
      root.render(
        <MantineProvider theme={theme}>
          <PopupContent machine={machine} />
        </MantineProvider>
      );
    });

    popup.current
      .setLngLat(coordinates)
      .setDOMContent(container)
      .addTo(map.current);
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [-98.5795, 39.8283],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '320px',
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      onMapLoaded?.();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map data when filtered machines change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredMachines.map((machine, index) => ({
        type: 'Feature',
        properties: {
          id: machine.id,
          index: index,
          status: machine.status,
          name: machine.name,
          address: machine.address,
          designs: machine.designs,
          updated: machine.updated || '',
          desc: machine.desc || '',
          images: machine.images || [],
        },
        geometry: {
          type: 'Point',
          coordinates: [machine.longitude, machine.latitude],
        },
      })),
    };

    // Check if source exists
    if (map.current.getSource('machines')) {
      // Clear existing cluster markers when data changes
      clusterMarkers.current.forEach((marker) => marker.remove());
      clusterMarkers.current.clear();

      (map.current.getSource('machines') as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      // Add source with clustering
      map.current.addSource('machines', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60,
        clusterProperties: {
          available_count: ['+', ['case', ['==', ['get', 'status'], 'available'], 1, 0]],
          outoforder_count: ['+', ['case', ['==', ['get', 'status'], 'outoforder'], 1, 0]],
          gone_count: ['+', ['case', ['==', ['get', 'status'], 'gone'], 1, 0]],
        },
      });

      // Cluster shadow layer
      map.current.addLayer({
        id: 'clusters-shadow',
        type: 'circle',
        source: 'machines',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(0, 0, 0, 0.2)',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            33,
            15, 41,
            150, 48,
          ],
          'circle-blur': 0.75,
          'circle-translate': [2, 2],
        },
      });

      // Cluster circles layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'machines',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['>=', ['get', 'available_count'], ['max', ['get', 'outoforder_count'], ['get', 'gone_count']]],
            '#22c55e',
            ['>=', ['get', 'outoforder_count'], ['get', 'gone_count']],
            '#f59e0b',
            '#ef4444',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10, 25,
            100, 30,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
        },
      });

      // Function to update cluster labels with HTML markers
      const updateClusterLabels = () => {
        if (!map.current) return;

        const features = map.current.querySourceFeatures('machines', {
          sourceLayer: '',
          filter: ['has', 'point_count'],
        });

        // Track which cluster IDs are currently visible
        const visibleClusterIds = new Set<number>();

        features.forEach((feature) => {
          const clusterId = feature.properties?.cluster_id as number;
          const pointCount = feature.properties?.point_count as number;
          const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

          visibleClusterIds.add(clusterId);

          // Check if marker already exists
          if (clusterMarkers.current.has(clusterId)) {
            // Update position
            clusterMarkers.current.get(clusterId)!.setLngLat(coordinates);
          } else {
            // Create new HTML marker for cluster count
            const el = document.createElement('div');
            el.className = 'cluster-label';
            el.textContent = pointCount >= 1000 ? `${Math.round(pointCount / 1000)}k` : String(pointCount);
            el.style.cssText = `
              color: white;
              font-family: "Sn Pro", sans-serif;
              font-size: 13px;
              font-weight: 700;
              pointer-events: none;
              text-align: center;
            `;

            const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
              .setLngLat(coordinates)
              .addTo(map.current!);

            clusterMarkers.current.set(clusterId, marker);
          }
        });

        // Remove markers for clusters that are no longer visible
        clusterMarkers.current.forEach((marker, clusterId) => {
          if (!visibleClusterIds.has(clusterId)) {
            marker.remove();
            clusterMarkers.current.delete(clusterId);
          }
        });
      };

      // Update cluster labels on map events
      map.current.on('render', updateClusterLabels);

      // Load icon images for markers
      const loadIcon = (name: string, svg: string): Promise<void> => {
        return new Promise((resolve) => {
          const img = new Image(16, 16);
          img.onload = () => {
            if (map.current && !map.current.hasImage(name)) {
              map.current.addImage(name, img);
            }
            resolve();
          };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        });
      };

      Promise.all([
        loadIcon('coin-icon', COIN_ICON_SVG),
        loadIcon('x-icon', X_ICON_SVG),
        loadIcon('arrow-icon', ARROW_UP_RIGHT_ICON_SVG),
      ]).then(() => {
        if (!map.current) return;

        // Individual point shadow layer
        map.current.addLayer({
          id: 'unclustered-point-shadow',
          type: 'circle',
          source: 'machines',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': 'rgba(0, 0, 0, 0.3)',
            'circle-radius': 16,
            'circle-blur': 0.75,
            'circle-translate': [2, 2],
          },
        });

        // Individual point circle layer (background)
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'machines',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'status'],
              'available', '#22c55e',
              'outoforder', '#f59e0b',
              '#ef4444',
            ],
            'circle-radius': 12,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Individual point icon layer (on top of circles)
        map.current.addLayer({
          id: 'unclustered-point-icon',
          type: 'symbol',
          source: 'machines',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'match',
              ['get', 'status'],
              'available', 'coin-icon',
              'outoforder', 'x-icon',
              'arrow-icon',
            ],
            'icon-size': 1,
            'icon-allow-overlap': true,
          },
        });
      });

      // Click on cluster to zoom
      map.current.on('click', 'clusters', async (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0].properties.cluster_id;
        const source = map.current!.getSource('machines') as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.current!.easeTo({
          center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
          zoom: zoom,
        });
      });

      // Click on point to show popup
      map.current.on('click', 'unclustered-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = feature.properties;

        const machine: PennyMachine = {
          id: props.id,
          name: props.name,
          address: props.address,
          status: props.status,
          designs: props.designs,
          latitude: coordinates[1],
          longitude: coordinates[0],
          updated: props.updated,
          desc: props.desc,
          images: JSON.parse(props.images),
        };

        showPopup(machine, coordinates);
      });

      // Cursor changes
      map.current.on('mouseenter', 'clusters', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current!.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point-icon', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point-icon', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    }
  }, [filteredMachines, mapLoaded, showPopup]);

  return (
    <Box w="100%" h="100vh" pos="relative">
      <div ref={mapContainer} style={{ width: '100%', height: '100%', backgroundColor: '#004177' }} />

      <MachineCounter
        filteredCount={filteredMachines.length}
        totalCount={machines.length}
        onHelpClick={() => setHelpModalOpened(true)}
      />

      <HelpModal
        opened={helpModalOpened}
        onClose={() => setHelpModalOpened(false)}
      />
    </Box>
  );
}
