export interface PennyMachineImage {
  title: string;
  url: string;
}

export interface PennyMachine {
  id: string;
  name: string;
  address: string;
  status: "available" | "outoforder" | "gone";
  designs: string;
  latitude: number;
  longitude: number;
  desc?: string;
  updated?: string;
  images: PennyMachineImage[];
}

export interface MapComponentProps {
  machines: PennyMachine[];
  searchTerm: string;
  selectedStatuses: string[];
  onMapLoaded?: () => void;
}
