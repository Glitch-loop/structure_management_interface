import { 
  IColor, 
  IGeographicArea, 
  IStrategyShow, 
  IZoneType,
  LatLng, 
  ISectional
} from "../../interfaces/interfaces"
import { randomNumber } from "../../utils/utils"

//Constants
const initialZoneType:IZoneType = {
  name: "Area geografica de estrategia",
  id: 0  
}

const arrGeographicAreaType:IZoneType[] = 
  [
    {
      name: "Area geografica de estrategia",
      id: 0
    },
    {
      name: "Seccional",
      id: 1
    }
]

const initialSectional:ISectional = {
  id_sectional: 0,
  sectional_name: "",
  sectional_address: "",
  target_members: 0,
  coordinates: [] 
}



//Functions
function getColorForPolygon(): any {
  const colorCombination:IColor = {
    target: 0,
    spectrum1: randomNumber(25),
    spectrum2: randomNumber(25),
    spectrum3: randomNumber(50),
    opactity: 1
  }

  const color = `rgb(${colorCombination.spectrum1}, ${colorCombination.spectrum2}, ${colorCombination.spectrum3})`

  const options = {
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: color,
    fillOpacity: 0.35,
  }
  return options;
}

function getPolygonColor(arrayColor:any[], id_strategy:number|undefined):any {
  let options:any = {};
  if(id_strategy === undefined) return options;
  const color = arrayColor.find(color => color.id_strategy === id_strategy);
  if(color !== undefined) options = color.options
  return options;
}

function getPolygonConfig(color: string):any {
  const options = {
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: color,
    fillOpacity: 0.35,
  }
  return options;
}

function getCoordinate(e: any): LatLng {
  const latitude = e.latLng.lat();
  const longuitude = e.latLng.lng();
  const coordinate:LatLng = {
    lat: latitude,
    lng: longuitude
  }

  return coordinate;
}

function getPolygonCoordinatesInUnmount(polygon: any):LatLng[] {
  const dataToReturn:LatLng[] = [];
  for(let i = 0; i < polygon.g.length; i++) {
    dataToReturn.push(
      {
        lat: polygon.g[i].lat(), 
        lng: polygon.g[i].lng()
      }
    )
  }
  return dataToReturn;
}

function polygonVisible(
  arrayStrategyLevels: IStrategyShow[], 
  polygon: IGeographicArea):boolean {
    const statusPolygon: IStrategyShow|undefined = arrayStrategyLevels.find(
      strategyLevel => strategyLevel.id_strategy === polygon.id_strategy);

      if(statusPolygon !== undefined) {
        if(statusPolygon.show !== undefined) {
          return statusPolygon.show;
        } 
      }

      return true;
}

const convertISectionalToIGeographicArea = (sectional: ISectional):IGeographicArea => {
  const geographicArea:IGeographicArea = {
    id_geographic_area: sectional.id_sectional * -1,
    geographic_area_name: sectional.sectional_name,
    id_geographic_area_belongs: sectional.id_sectional,
    id_member: sectional.target_members,
    id_strategy: -1,
    coordinates: sectional.coordinates
  };
  return geographicArea;
}

function getColorForPercentage(percentage: number, opacity:number): string {
  // Calculate hue value based on the percentage (0 is red, 120 is green)
  const hue: number = (120 * (percentage / 100)).toFixed(0) as unknown as number;
  
  // Set constant saturation and lightness
  const saturation = 100;
  const lightness = 50;
  
  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
      h /= 360;
      s /= 100;
      l /= 100;
      let r, g, b;
    
      if (s === 0) {
          r = g = b = l; // achromatic
      } else {
          const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          };
    
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }
    
      return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
      };
  };
  
  const rgb = hslToRgb(hue, saturation, lightness);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}


export {
  initialZoneType,
  arrGeographicAreaType,
  initialSectional,
  getColorForPolygon,
  getPolygonColor,
  getPolygonConfig,
  getCoordinate,
  getPolygonCoordinatesInUnmount,
  polygonVisible,
  convertISectionalToIGeographicArea,
  getColorForPercentage
}