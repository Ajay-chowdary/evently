export type LocationSuggestion = {
  id: string;
  label: string;
  venueName: string;
  city: string;
  region: string;
  addressLine1?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
};
