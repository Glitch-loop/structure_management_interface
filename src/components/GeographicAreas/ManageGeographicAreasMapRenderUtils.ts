import { 
  IColor, 
  IGeographicArea, 
  IRequest, 
  ISectional, 
  IStrategy, 
  IStructure, 
  IStrategyShow, 
  IZoneType,
  LatLng, 
} from "../../interfaces/interfaces"
import { randomNumber } from "../../utils/utils"

//Constants
const initialGeographicAreaState:IGeographicArea = {
  id_geographic_area: 0,
  id_geographic_area_belongs: 0,
  geographic_area_name: "",
  id_member: 0,
  id_strategy: 0,
  coordinates: [],
  edtiable: false,
}

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

export {
  initialGeographicAreaState,
  initialZoneType,
  arrGeographicAreaType,
  getColorForPolygon,
  getPolygonColor,
  getCoordinate,
  getPolygonCoordinatesInUnmount,
  polygonVisible
}