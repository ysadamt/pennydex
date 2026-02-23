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

export interface UserMachineSummary {
  id: string;
  name: string;
  address: string;
}

export interface MapComponentProps {
  machines: PennyMachine[];
  searchTerm: string;
  selectedStatuses: string[];
  selectedSavedFilters?: string[];
  onMapLoaded?: () => void;
  favoriteMachineIds?: string[];
  visitedMachineIds?: string[];
  isSignedIn?: boolean;
  onRequireSignIn?: () => void;
  onFavoriteChange?: (machineId: string, isFavorite: boolean) => Promise<void>;
  onVisitedChange?: (machineId: string, isVisited: boolean) => Promise<void>;
}
