'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box, Text, Badge, Group, Stack, MantineProvider, Button, Modal, ScrollArea, Paper, ActionIcon, Anchor } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { QuestionIcon } from '@phosphor-icons/react/dist/ssr';

// SVG icons from Phosphor (regular weight) - encoded for use in MapLibre
const COIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 256 256"><path d="M209.37,60.27C188.08,49.62,160,44,128,44S67.92,49.62,46.63,60.27C24.62,71.27,12,87.21,12,104v48c0,16.79,12.62,32.73,34.63,43.73C67.92,206.38,96.05,212,128,212s60.08-5.62,81.37-16.27c22-11,34.63-26.94,34.63-43.73V104C244,87.21,231.38,71.27,209.37,60.27Zm-152,21.46C75.08,72.88,100.16,68,128,68s52.92,4.88,70.63,13.73C211.81,88.32,220,96.86,220,104s-8.19,15.68-21.37,22.27C180.92,135.12,155.84,140,128,140s-52.92-4.88-70.63-13.73C44.19,119.68,36,111.14,36,104S44.19,88.32,57.37,81.73ZM180,181.38a180.38,180.38,0,0,1-40,6.3v-24a210.39,210.39,0,0,0,40-5.51ZM76,158.22a210.39,210.39,0,0,0,40,5.51v24a180.38,180.38,0,0,1-40-6.3ZM36,152V141.54a94.54,94.54,0,0,0,10.63,6.19c1.74.87,3.54,1.7,5.37,2.5V171.3C42,165.24,36,158.11,36,152Zm168,19.3V150.23c1.83-.8,3.63-1.63,5.37-2.5A94.54,94.54,0,0,0,220,141.54V152C220,158.11,214,165.24,204,171.3Z"></path></svg>`;
const X_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 256 256"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path></svg>`;
const ARROW_UP_RIGHT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 256 256"><path d="M204,64V168a12,12,0,0,1-24,0V93L72.49,200.49a12,12,0,0,1-17-17L163,76H88a12,12,0,0,1,0-24H192A12,12,0,0,1,204,64Z"></path></svg>`;

interface PennyMachineImage {
  title: string;
  url: string;
}

interface PennyMachine {
  id: string;
  name: string;
  address: string;
  status: 'available' | 'outoforder' | 'gone';
  designs: string;
  latitude: number;
  longitude: number;
  desc?: string;
  updated?: string;
  images: PennyMachineImage[];
}

interface MapComponentProps {
  machines: PennyMachine[];
  searchTerm: string;
  selectedStatuses: string[];
}

const getStatusColor = (status: string): string => {
  if (status === 'available') return '#22c55e';
  if (status === 'outoforder') return '#f59e0b';
  return '#ef4444';
};

const getStatusLabel = (status: string): string => {
  if (status === 'available') return 'Available';
  if (status === 'outoforder') return 'Out of Order';
  return 'Gone';
};

const getStatusBadgeColor = (status: string): string => {
  if (status === 'available') return 'green';
  if (status === 'outoforder') return 'yellow';
  return 'red';
};

// Popup content component using Mantine
function PopupContent({ machine, onMoreDetail }: { machine: PennyMachine; onMoreDetail: () => void }) {
  return (
    <Box style={{ minWidth: 260, padding: '16px 4px 4px 4px' }}>
      <Group justify="space-between" align="flex-start" gap="xs" mb="xs">
        <Stack gap={2} style={{ flex: 1 }}>
          <Text fw={600} size="sm" c="dark">
            {machine.name}
          </Text>
          <Text size="xs" c="dimmed">
            {machine.address}
          </Text>
        </Stack>
        <Badge color={getStatusBadgeColor(machine.status)} variant="light" size="sm">
          {getStatusLabel(machine.status)}
        </Badge>
      </Group>

      <Group gap="xs" mb="xs">
        <Text size="xs" fw={500} mr={-6}>
          Designs:
        </Text>
        <Badge variant="outline" color="gray" size="sm">
          {machine.designs}
        </Badge>
      </Group>

      {machine.updated && (
        <Text size="xs" c="dimmed">
          Last updated: {machine.updated}
        </Text>
      )}

      {machine.desc && (
        <Button
          variant="light"
          size="xs"
          mt="xs"
          fullWidth
          onClick={onMoreDetail}
        >
          More Detail
        </Button>
      )}
    </Box>
  );
}

export default function MapComponent({ machines, searchTerm, selectedStatuses }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const clusterMarkers = useRef<Map<number, maplibregl.Marker>>(new Map());
  const [filteredMachines, setFilteredMachines] = useState<PennyMachine[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<PennyMachine | null>(null);
  const [helpModalOpened, setHelpModalOpened] = useState(false);

  // Handle opening the detail modal
  const handleMoreDetail = useCallback((machine: PennyMachine) => {
    setSelectedMachine(machine);
    setModalOpened(true);
    popup.current?.remove();
  }, []);

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
        <MantineProvider>
          <PopupContent machine={machine} onMoreDetail={() => handleMoreDetail(machine)} />
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
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            minzoom: 1,
            maxzoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 1,
            maxzoom: 19,
          },
        ],
      },
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
              font-family: "Instrument Sans", sans-serif;
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

        console.log('Clicked machine properties:', props);

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
    <Box style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', backgroundColor: '#004177' }} />

      <Group pos="absolute" bottom={12} left={12} gap={8} align="center">
        <Box
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            fontSize: 12,
            color: '#666',
            zIndex: 1,
          }}
        >
          <Text size="xs" fw={500}>
            Showing {filteredMachines.length} of {machines.length} machines
          </Text>
        </Box>
        {/* A Help button with a question mark icon that opens a modal */}
        <Box
          style={{
            background: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            color: '#666',
            zIndex: 1,
          }}
        >
          <ActionIcon
            variant="transparent"
            size={40.797}
            onClick={() => setHelpModalOpened(true)}
          >
            <QuestionIcon size={24} color="black" />
          </ActionIcon>
        </Box>
      </Group>

      {/* Help Modal */}
      <Modal
        opened={helpModalOpened}
        onClose={() => setHelpModalOpened(false)}
        title="How to Use PennyDex"
        size="md"
        styles={{
          title: {
            fontWeight: 600,
            fontSize: '1.5rem',
            paddingTop: '8px',
          },
        }}
      >
        <Stack gap="md">
          <Text size="sm">
            Welcome to <strong>PennyDex</strong>; your interactive guide to finding pressed penny machines worldwide! Here's how to make the most of PennyDex.
          </Text>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Search</Text>
            <Text size="sm" c="dimmed">
              Use the search bar to filter machines by name or address. Start typing to see matching results.
            </Text>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Status Filters</Text>
            <Text size="sm" c="dimmed">
              Use the status filters to show machines by their current status:
            </Text>
            <Group gap="xs">
              <Badge color="green" variant="light" size="sm">Available</Badge>
              <Text size="xs" c="dimmed">Machine is working</Text>
            </Group>
            <Group gap="xs">
              <Badge color="yellow" variant="light" size="sm">Out of Order</Badge>
              <Text size="xs" c="dimmed">Machine needs repair</Text>
            </Group>
            <Group gap="xs">
              <Badge color="red" variant="light" size="sm">Gone</Badge>
              <Text size="xs" c="dimmed">Machine has been removed</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Map Navigation</Text>
            <Text size="sm" c="dimmed">
              Click on clusters to zoom in and see individual machines. Click on a machine marker to view its details, including available designs and images.
            </Text>
          </Stack>

          <Text size="xs" c="dimmed" mt="sm">
            Data sourced from <Anchor href="http://locations.pennycollector.com/" target="_blank" rel="noopener noreferrer">PennyCollector.com</Anchor>. If you have updates or corrections, please contact the site administrator.
          </Text>
        </Stack>
      </Modal>

      {/* Detail Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={selectedMachine?.name || 'Machine Details'}
        size="lg"
        styles={{
          title: {
            fontWeight: 600,
            fontSize: '1.75rem',
            paddingTop: '8px',
          },
        }}
      >
        {selectedMachine && (
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={4} maw="70%">
                <Text size="sm" c="dimmed">
                  {selectedMachine.address}
                </Text>
                <Group gap="xs">
                  <Text size="sm" fw={500} mr={-6}>
                    Designs:
                  </Text>
                  <Badge variant="outline" color="gray" size="sm">
                    {selectedMachine.designs}
                  </Badge>
                </Group>
                {selectedMachine.updated && (
                  <Text size="xs" c="dimmed">
                    Last updated: {selectedMachine.updated}
                  </Text>
                )}
              </Stack>
              <Badge color={getStatusBadgeColor(selectedMachine.status)} variant="light">
                {getStatusLabel(selectedMachine.status)}
              </Badge>
            </Group>

            {selectedMachine.desc && (
              <ScrollArea.Autosize mah={400}>
                <Box
                  className="html-content"
                  bg="#f9f9f9"
                  p="12px"
                  fz="0.9rem"
                  style={{
                    lineHeight: 1.6,
                    borderRadius: 4,
                  }}
                >
                  {parse(DOMPurify.sanitize(selectedMachine.desc, { USE_PROFILES: { html: true } }))}
                </Box>
              </ScrollArea.Autosize>
            )}

            {/* show images */}
            {selectedMachine.images && selectedMachine.images.length > 0 && (
              <Stack gap="sm">
                <Text size="lg" fw={500}>
                  Images:
                </Text>
                <Carousel
                  withIndicators={selectedMachine.images.length > 1}
                  withControls={selectedMachine.images.length > 1}
                  slideSize="100%"
                  slideGap={0}
                  emblaOptions={{ align: 'start', slidesToScroll: 1 }}
                  styles={{
                    indicator: {
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      '&[dataActive]': {
                        backgroundColor: 'white',
                      },
                    },
                  }}
                >
                  {selectedMachine.images.map((img, idx) => (
                    <Carousel.Slide key={idx}>
                      <Paper
                        radius="md"
                        style={{
                          backgroundImage: `url(${img.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          height: 250,
                          display: 'flex',
                          flexDirection: 'column',
                          padding: 16,
                        }}
                      >
                        <Text
                          size="sm"
                          fw={600}
                          style={{
                            color: 'white',
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            padding: '8px 12px',
                            borderRadius: 4,
                          }}
                        >
                          {img.title}
                        </Text>
                      </Paper>
                    </Carousel.Slide>
                  ))}
                </Carousel>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
