import { GoogleMap, useLoadScript, PolygonF, Polyline } from "@react-google-maps/api"
import { useState } from "react"
import {FiPlus} from "react-icons/fi"
import '../../styles/global.css'
import { Tooltip } from "@mui/material"

interface LatLng {
  lat: number,
  lng: number
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

const Map = ( ) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBX5Z9uYDi-23tQ0ieX56vpOZ3_mKcXXmY"
  })
  if(!isLoaded) return <div>Loading...</div>
  return <MapRender />
}


function MapRender() {
  const [line, setLine] = useState<LatLng[]|undefined>(undefined);
  const [centerMap, setCenterMap] = useState<LatLng>({lat:20.64125680004875, lng: -105.22139813464167});
  const [modifyCoordinateInLine, setModifyCoordinateInLine] = useState<number|undefined>(undefined);
  const [lastPointAdded, setLastPointAdded] = useState<LatLng|undefined>(undefined);
  const [polygons, setPolygons] = useState<LatLng[][]>([]);
  const [createNewPolygon, setCreateNewPolygon] = useState<boolean>(false)

  const newPolygoncreation = (e: any):void => {
    if(createNewPolygon) {
      const newCoordinate:LatLng = getCoordinate(e);
      if(line!==undefined) setLine([...line, newCoordinate]);
    }
  }

  //This function was though for complete the polygon
  const handleClickLine = (e: any): void => {
    console.log("-------------------------------------------------")
    console.log(line)
    console.log("-------------------------------------------------")
    if(line !== undefined){
      if(line.length >= 3) {
        const terminalCoordinate:LatLng = getCoordinate(e);
        if(line[0].lat === terminalCoordinate.lat && line[0].lng === terminalCoordinate.lng){
          console.log("Finishing our region")
          polygons.push(line);
          console.log(polygons)
          setPolygons(polygons);
          setLine([]);
          setCreateNewPolygon(false);
        }
      }  
    }
  }

  //The user wants to update a point or he wants to add one between the line
  const handleMouseDownLine = (e: any): void => {
    const terminalCoordinate:LatLng = getCoordinate(e)
    if(line!==undefined) {
      const index: number = line.findIndex((point) => {
        if(point.lat === terminalCoordinate.lat && point.lng === terminalCoordinate.lng) return true
        else return false
      })
      
      //index different -1 means that the user is going to update an existing node, otherwise a new node is going to be added
      index !== -1 ? setModifyCoordinateInLine(index) : setModifyCoordinateInLine(undefined)
    }

  }

  //The finish to update a point or he wants to add one between the line
  const handleMouseUpLine = (e:any): void => {
    if(line!==undefined) {
      const newCoordinate:LatLng = getCoordinate(e);
  
      if(modifyCoordinateInLine !== undefined) {
        line[modifyCoordinateInLine] = newCoordinate;
      } else {      
        setLastPointAdded(newCoordinate)
        line.push(newCoordinate)
      }
  
      setLine(line)
    }
  }

  const handleRightClickLine = (e:any):void => {
    if(line!== undefined) {
      const coordinateToDelete = getCoordinate(e);
      if(line.length === 1) {
        setLine([])
      } else {
        setLine(line.filter(point => {
          if(point.lat !== coordinateToDelete.lat && point.lng !== coordinateToDelete.lng) return true
          else return false
        }))
      }
    }
  }

  const handleMouseMoveLine = (e: any):void => {
    if(line!==undefined) {
      setLine(line)
      let vertexInLine:number = e.vertex;
      if(vertexInLine !== undefined) {
        if(lastPointAdded !== undefined && line[0] !== undefined) {
          setLine(line)
          let swap:LatLng =  line[vertexInLine];
          
          line[vertexInLine] = lastPointAdded;
          vertexInLine++;
          while(!(lastPointAdded.lat === line[vertexInLine].lat 
            && lastPointAdded.lng === line[vertexInLine].lng) && vertexInLine <= line.length - 2) {
              const tempSwap:LatLng = line[vertexInLine];
              line[vertexInLine] = swap;
              swap = tempSwap; 
              vertexInLine++;
          }
          
          line[vertexInLine] = swap;
          setLastPointAdded(undefined);
          setLine(line);
        } else console.log("there isn't necessity to re-order")
      }
    }
  }

  const handleCreateNewArea = (): void => {
    if(createNewPolygon) {
      setLine([]);
      setCreateNewPolygon(false);
    } else {
      setCreateNewPolygon(true);
    }
  }
  return <>
    <div className="absolute flex-col w-full h-full justify-center">
      {/* <h1 className="bg-blue-100 z-10 absolute">class</h1> */}
      <Tooltip title="Crear nueva area">
        <button
          onClick={() => handleCreateNewArea()} 
          className={`z-10 absolute p-5 rounded-full hover:bg-blue-800 bottom-0 left-0 mb-12 ml-3 ${createNewPolygon ? "bg-blue-800" : "bg-blue-600"}`} >
          <div className="text-white">
            <FiPlus />
          </div>
        </button>
      </Tooltip>
    </div>
    <GoogleMap 
        zoom={14}
        center={centerMap} 
        mapContainerClassName="map-container"
        onClick={(e: any) => newPolygoncreation(e)}
        >
          {
            polygons.map((polygon) => 
            <PolygonF
              key={polygon[0].lat}
              visible={true}
              editable
              path={polygon}
            ></PolygonF>
            )
          }
          
          {
            line !== undefined &&
              <Polyline 
                editable
                onClick={(e: any) => { handleClickLine(e)} } 
                // onDrag={(e: any) => console.log(e)}
                onMouseMove={(e:any) => handleMouseMoveLine(e)}
                // onMouseOver={(e:any) => console.log("onMouseOver: ", e)}
                // onUnmount={(e: any) => console.log("UNMOINTING: ", e)}
                onMouseDown={(e:any) => handleMouseDownLine(e)}
                onMouseUp={(e:any) => handleMouseUpLine(e)}
                onRightClick={(e:any) => handleRightClickLine(e)}
                path={line}
              />          
          }
    </GoogleMap>
  </>
}

export default Map