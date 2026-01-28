export interface Company {
  id: string;
  name: string;
  description: string;
  theme: {
    websiteTitle: string;
    primaryColor: string;
    additionalColors: string[];
    font: string;
  };
  isInstalled: boolean;
}
