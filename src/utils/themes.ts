import { Theme } from '../types/invoice';

export const themes: Theme[] = [
  {
    id: 'modern',
    name: 'Modern Blue',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    headerStyle: 'modern'
  },
  {
    id: 'classic',
    name: 'Classic Green',
    primaryColor: '#10B981',
    secondaryColor: '#047857',
    accentColor: '#34D399',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    headerStyle: 'classic'
  },
  {
    id: 'minimal',
    name: 'Minimal Gray',
    primaryColor: '#6B7280',
    secondaryColor: '#374151',
    accentColor: '#9CA3AF',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    headerStyle: 'minimal'
  },
  {
    id: 'elegant',
    name: 'Elegant Purple',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    accentColor: '#A78BFA',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    headerStyle: 'modern'
  },
  {
    id: 'bold',
    name: 'Bold Orange',
    primaryColor: '#F97316',
    secondaryColor: '#EA580C',
    accentColor: '#FB923C',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    headerStyle: 'modern'
  },
  {
    id: 'professional',
    name: 'Professional Navy',
    primaryColor: '#1E40AF',
    secondaryColor: '#1E3A8A',
    accentColor: '#3B82F6',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    headerStyle: 'classic'
  }
];

export const getTheme = (themeId: string): Theme => {
  return themes.find(theme => theme.id === themeId) || themes[0];
};