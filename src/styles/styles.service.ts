import { Injectable } from '@nestjs/common';

export type StyleAudience = 'WOMEN' | 'MEN' | 'TEENAGERS' | 'CHILDREN';
export type MeasurementField = { key: string; label: string };
export type GarmentStyle = {
  id: string; audience: StyleAudience; name: string; description: string;
  garmentType: string; imageUrl?: string; measurementFields: MeasurementField[];
};

const STYLE_CATALOGUE: GarmentStyle[] = [
  { id: 'women-blouse', audience: 'WOMEN', name: 'Saree Blouse', description: 'Classic and designer blouse stitching', garmentType: 'BLOUSE', measurementFields: [{key:'bust',label:'Bust'},{key:'underBust',label:'Under bust'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'blouseLength',label:'Blouse length'},{key:'sleeveLength',label:'Sleeve length'}] },
  { id: 'women-kurti', audience: 'WOMEN', name: 'Kurti', description: 'Straight, A-line and everyday kurtis', garmentType: 'KURTA', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'hip',label:'Hip'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'kurtaLength',label:'Kurti length'}] },
  { id: 'women-suit', audience: 'WOMEN', name: 'Salwar Suit', description: 'Custom salwar kameez and suit sets', garmentType: 'DRESS', measurementFields: [{key:'bust',label:'Bust'},{key:'waist',label:'Waist'},{key:'hip',label:'Hip'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'dressLength',label:'Top length'}] },
  { id: 'women-lehenga', audience: 'WOMEN', name: 'Lehenga', description: 'Festive and occasion wear', garmentType: 'DRESS', measurementFields: [{key:'waist',label:'Waist'},{key:'hip',label:'Hip'},{key:'dressLength',label:'Lehenga length'},{key:'bust',label:'Blouse bust'},{key:'shoulder',label:'Shoulder'}] },
  { id: 'men-shirt', audience: 'MEN', name: 'Formal / Casual Shirt', description: 'Made-to-measure shirts', garmentType: 'SHIRT', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'shirtLength',label:'Shirt length'},{key:'neck',label:'Neck'}] },
  { id: 'men-kurta', audience: 'MEN', name: 'Men’s Kurta', description: 'Traditional and contemporary kurtas', garmentType: 'KURTA', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'kurtaLength',label:'Kurta length'}] },
  { id: 'men-trousers', audience: 'MEN', name: 'Trousers', description: 'Formal and casual trousers', garmentType: 'TROUSERS', measurementFields: [{key:'waist',label:'Waist'},{key:'hip',label:'Hip'},{key:'inseam',label:'Inseam'},{key:'outseam',label:'Outseam'},{key:'thigh',label:'Thigh'},{key:'ankle',label:'Ankle'}] },
  { id: 'men-blazer', audience: 'MEN', name: 'Blazer', description: 'Tailored formal and occasion blazers', garmentType: 'SHIRT', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'shirtLength',label:'Blazer length'},{key:'neck',label:'Neck'}] },
  { id: 'teen-casual', audience: 'TEENAGERS', name: 'Casual Tops & Shirts', description: 'Everyday casual looks for teens', garmentType: 'SHIRT', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'shirtLength',label:'Top length'},{key:'neck',label:'Neck'}] },
  { id: 'teen-coord', audience: 'TEENAGERS', name: 'Co-ord Set', description: 'Matching top and bottom sets', garmentType: 'DRESS', measurementFields: [{key:'bust',label:'Bust / chest'},{key:'waist',label:'Waist'},{key:'hip',label:'Hip'},{key:'shoulder',label:'Shoulder'},{key:'dressLength',label:'Top length'}] },
  { id: 'teen-hoodie', audience: 'TEENAGERS', name: 'Hoodie / Sweatshirt', description: 'Comfortable custom casual wear', garmentType: 'SHIRT', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'shirtLength',label:'Body length'}] },
  { id: 'child-frock', audience: 'CHILDREN', name: 'Frock', description: 'Everyday and party frocks', garmentType: 'DRESS', measurementFields: [{key:'bust',label:'Chest / bust'},{key:'waist',label:'Waist'},{key:'hip',label:'Hip'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'dressLength',label:'Frock length'}] },
  { id: 'child-kurta', audience: 'CHILDREN', name: 'Kids Kurta Set', description: 'Traditional outfits for children', garmentType: 'KURTA', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'kurtaLength',label:'Kurta length'}] },
  { id: 'child-shirt', audience: 'CHILDREN', name: 'Kids Shirt & Shorts', description: 'Custom casual sets for children', garmentType: 'SHIRT', measurementFields: [{key:'chest',label:'Chest'},{key:'waist',label:'Waist'},{key:'shoulder',label:'Shoulder'},{key:'sleeveLength',label:'Sleeve length'},{key:'shirtLength',label:'Shirt length'}] },
];

@Injectable()
export class StylesService {
  findAll(audience?: string) {
    if (!audience) return STYLE_CATALOGUE;
    const normalized = audience.toUpperCase();
    if (!['WOMEN', 'MEN', 'TEENAGERS', 'CHILDREN'].includes(normalized)) return [];
    return STYLE_CATALOGUE.filter((style) => style.audience === normalized);
  }
}
