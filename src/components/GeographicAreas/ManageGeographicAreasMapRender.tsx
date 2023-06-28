import { GoogleMap, PolygonF, Polyline } from "@react-google-maps/api"
import { useState, useEffect, useRef } from "react"
import {FiPlus} from "react-icons/fi"
import '../../styles/global.css'
import { DialogTitle, Tooltip } from "@mui/material"
import {Dialog} from "@mui/material"
import Input from "../UIcomponents/Input"
import Button from "../UIcomponents/Button"
import requester from "../../helpers/Requester"
import { IRequest, LatLng, IGeographicArea, IStrategy } from "../../interfaces/interfaces"
import { Autocomplete, TextField } from "@mui/material"
 
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

function ManageGeographicAreasMapRender() {
  const [line, setLine] = useState<LatLng[]|undefined>(undefined);
  const [centerMap, setCenterMap] = useState<LatLng>({lat:20.64125680004875, lng: -105.22139813464167});
  
  const [modifyCoordinateInLine, setModifyCoordinateInLine] = useState<number|undefined>(undefined);
  const [lastPointAdded, setLastPointAdded] = useState<LatLng|undefined>(undefined);
  
  const [polygons, setPolygons] = useState<IGeographicArea[]>([]);
  const [polygonsForWork, setPolygonForWork] = useState<IGeographicArea[]>([]);
  const [createNewPolygon, setCreateNewPolygon] = useState<boolean>(false)
 
  
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [ask, setAsk] = useState<boolean>(true)
  
  //Logic for geographic areas --- Polygons
  //False = line, true = polygon
  const [managePolygon, setManagePolygon] = useState<boolean>(false) 
  const [currentPolygonToUpdate, setCurrentPolygonToUpdate] = useState<undefined|IGeographicArea>(undefined)
  const [currentPolygonPoint, setCurrentPolygonPoint] = useState<LatLng|undefined>(undefined)
  const [polygonToManage, setPolygonToManage] = useState<IGeographicArea|undefined>(undefined)

  const refCurrentPolygon = useRef<IGeographicArea|undefined>(undefined);
  const refCurrentPolygonAction = useRef<boolean>(false)
  //Logic for strategy
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([]);
  const [searchStrategyLevel, setSearchStrategyLevel] = useState<string>("");
  const [idStrategy, setIdStrategy] = useState<number|undefined>(undefined);
  const [geographicAreaName, setGeographicAreaName] = useState<string>("")

  //Especial logic
  const [updateMap, setUpdateMap] = useState<boolean>(false)

  useEffect(() => {
    getAllPolygons()
    getStrategy()
  }, [])

  //Use effect functions
  const getAllPolygons = async () => { 
    const response:IRequest<IGeographicArea[]> = await requester({
      url: `/geographicAreas`
    })

    if(response.data !== undefined) {
      const polygonsDB = response.data;
      setPolygons(polygonsDB)
      setPolygonForWork(polygonsDB)

      console.log("ASK DB: ", polygonsDB)
    }
  }


  const getStrategy = async() => {
    const response:IRequest<IStrategy[]> = await requester({
      url: `/strategyLevels`,
      method: 'GET'
    })
    if(response.data !== undefined) {
      const strategyLevels:IStrategy[] = response.data.filter(level => level.zone_type !== "")
      setArrayStrategyLevel(strategyLevels)
    }
  }

  //Handlers -- MAPS
  const handleClickMap = async (e: any):void => {
    if(createNewPolygon) {
      const newCoordinate:LatLng = getCoordinate(e);
      setManagePolygon(false);
      if(line!==undefined) setLine([...line, newCoordinate]);
    }
    // console.log("maps")
    // if(updateMap){
    //   await getAllPolygons()
    //   setUpdateMap(false)
    //   // setPolygons(polygons.map(polygon => {polygon.edtiable=false; return polygon}));
    // } else {
    //   setPolygons([])
    // }
    setAsk(!ask)
    refCurrentPolygon.current = undefined;
    
  }

  const handleOnMouseMoveMap = (e: any): void => {
    console.log("move map")
    
    if(polygonToManage !== undefined) {
      const index:number = polygonsForWork.findIndex(polygon => polygon.id_geographic_area === polygonToManage.id_geographic_area)
      polygonsForWork[index] = polygonToManage
      setPolygonToManage(undefined)
    }
    setPolygons(polygonsForWork)
  }

  //Handlres -- LINES
  //This function was though for complete the polygon
  const handleClickLine = (e: any): void => {
    if(line !== undefined){
      if(line.length >= 3) {
        const terminalCoordinate:LatLng = getCoordinate(e);
        if(line[0].lat === terminalCoordinate.lat && line[0].lng === terminalCoordinate.lng){
          line.push(terminalCoordinate)
          const newPolygon:IGeographicArea = {
            id_geographic_area: 0,
            id_geographic_area_belongs: undefined,
            geographic_area_name: undefined,
            id_member: undefined,
            id_strategy: undefined,
            coordinates: line
          };

          setShowDialog(true)
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
      setLine([])
      setCreateNewPolygon(true);
      setSearchStrategyLevel("");
      setIdStrategy(undefined);
      setGeographicAreaName("");
    }
  }

  const handleOnSubmitAddGeographicArea = async () => {
    const geographicArea = {
      geographicAreaName: geographicAreaName,
      geographicAreaCoordinates: line
    }

    const response:IRequest<IGeographicArea> = await requester({
      url: "/geographicAreas",
      method: "POST",
      data: geographicArea
    })

    if(response.data !== undefined) {
      const id_geographic_area:number|undefined = response.data.id_geographic_area;

      polygonsForWork.push({
        id_geographic_area: id_geographic_area,
        coordinates: line,
        geographic_area_name: geographicAreaName
      })

      if(id_geographic_area !== undefined && idStrategy !== undefined) {
        const response:IRequest<IGeographicArea> = await requester({
          url: `/geographicAreas/strategicInformation/strategyLevel/${id_geographic_area}/${idStrategy}`,
          method: "PUT"
        })
      }
    }

    setShowDialog(false)
    setLine([]);
  }

  // Handlers -- POLYGON
  const handleDataClickPolygon = (e: any, polygon: IGeographicArea):void => {
    const idPolygon = polygon.id_geographic_area;
    if(idPolygon!==undefined) {
      const coordinate:LatLng = getCoordinate(e);
      
      //Be secure that there is just one polygon to update
      const newPolygons = polygons.map(polygon => {polygon.edtiable = false; return polygon})

      //Find the polygon's index to update
      const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon)

      newPolygons[index].edtiable = true;
      // setPolygons(newPolygons)
      setAsk(!ask)
    }

    setLine([]);
    setCreateNewPolygon(false);
    refCurrentPolygonAction.current = false;
  }

  const handleDbClickPolygon = (e: any, polygon: IGeographicArea): void => {
    setManagePolygon(true)
    setShowDialog(true)
    if(polygon.geographic_area_name !== undefined) {
      setGeographicAreaName(polygon.geographic_area_name)
    }
    if(polygon.id_strategy !== undefined && polygon.id_strategy !== null) {
      const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy === polygon.id_strategy)
      setIdStrategy(polygon.id_strategy)
      setSearchStrategyLevel(arrayStrategyLevel[index].zone_type)
    } else {
      setIdStrategy(undefined)
      setSearchStrategyLevel("")
    }
    setCurrentPolygonToUpdate(polygon)
  }

  const handleRightClickLinePolyline = (e:any, idPolygon: number|undefined):void => {
    if(idPolygon!== undefined) {
      const coordinateToDelete = getCoordinate(e); // Get coordinate to delete
      
      //Get index of the area to delete the coordinate
      const index = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon);
      if(polygons[index].coordinates !== undefined) { 
        
        //Get new polygon
        const newPolygon:LatLng[]|undefined = polygons[index].coordinates?.filter(coordinate => {
          if(coordinate.lat !== coordinateToDelete.lat && 
            coordinate.lng !== coordinateToDelete.lng) return true
          else return false
        })

        //If the polygon is not undefined 
        if(newPolygon !== undefined) {
          if(newPolygon.length >= 3) {
            polygons[index].coordinates = newPolygon
            const newGeographicArea:IGeographicArea[] = polygons
  
            setPolygons(newGeographicArea)
            setAsk(!ask)
          } 
        }
      }
    }
  }

  const handleMouseDownPolygon = (e:any) => {
    const coordinates = getCoordinate(e);
    setCurrentPolygonPoint(coordinates)
  }

  const handleMouseUpPolygon = (e:any, currentPolygon: IGeographicArea): void => {
    const idPolygon = currentPolygon.id_geographic_area;
    const editable =  currentPolygon.edtiable;
    const coordinates = getCoordinate(e)
    if(idPolygon!==undefined && 
      editable && 
      coordinates.lat !== currentPolygonPoint?.lat &&
      coordinates.lng !== currentPolygonPoint?.lng) {
      //Find the geographic area to save
      const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon)
      refCurrentPolygon.current = polygons[index]; //Save geographic area

      //Delete the geographic area

      setPolygons(polygons.filter(polygon => polygon.id_geographic_area !== idPolygon))
    } else { 
      const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon)
      polygons[index].edtiable = false
      setPolygons(polygons)
      setAsk(!ask)
    }
  }

  const handleUnmountPolygon = async (e:any, idPolygon: number|undefined) => {
    console.log("UNMOUNTING")
    if(idPolygon !== undefined) {
      //This process is to update the polygon (add, delete, move vertices)
      if(refCurrentPolygon!==undefined) {
        //Get current polygon
        const currentCoordinatesPolygon:any = e.getPath();
        //If there are coordinates, save the new polygon 
        if(refCurrentPolygon.current?.coordinates != undefined){
          refCurrentPolygon.current.coordinates = getPolygonCoordinatesInUnmount(currentCoordinatesPolygon);

          //Find the geographic area to save
          const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === refCurrentPolygon.current?.id_geographic_area)
          polygons[index].coordinates = refCurrentPolygon.current.coordinates;
          
          
          setPolygonToManage(polygons[index])
        }
      }
    }

  }

  const handleOnSubmitUpdateGeographicArea = async (e: any) => {
    try {
      if(currentPolygonToUpdate!==undefined) {
        const indexPolygonUpdating:number = polygons.findIndex(
          polygon => polygon.id_geographic_area === currentPolygonToUpdate.id_geographic_area)
        
        if(polygons[indexPolygonUpdating].geographic_area_name !== geographicAreaName) {
          const responseUpdateGeographicArea:IRequest<undefined> = await requester({
            url: `/geographicAreas/${currentPolygonToUpdate.id_geographic_area}`,
            method: 'PUT',
            data: {geographicAreaName: geographicAreaName}
          })
          
          if(responseUpdateGeographicArea.code === 200) 
            polygons[indexPolygonUpdating].geographic_area_name = geographicAreaName;
        }
        
        const responseCoordinates:IRequest<undefined> = await requester({
          url: `/geographicAreas/coordinates/${currentPolygonToUpdate.id_geographic_area}`,
          method: 'PUT',
          data: {geographicAreaCoordinates: currentPolygonToUpdate.coordinates}
        })
        
        if(responseCoordinates.code === 200) 
          polygons[indexPolygonUpdating].coordinates = currentPolygonToUpdate.coordinates;
      
        if(idStrategy !== undefined) {
          if(polygons[indexPolygonUpdating].id_strategy !== idStrategy) {
            const responseIdStrategyGeographicArea:IRequest<undefined> =await requester({
              url: `/geographicAreas/strategicInformation/strategyLevel/${currentPolygonToUpdate.id_geographic_area}/${idStrategy}`,
              method: "PUT"
            })
  
            if(responseIdStrategyGeographicArea.code === 200) 
              polygons[indexPolygonUpdating].id_strategy = idStrategy;
          }
        }
  
        setShowDialog(false)
        setPolygons(polygons)
        setAsk(!ask)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleOnSubmitDeleteGeographicArea = async (e: any) => {
    if(currentPolygonToUpdate!==undefined) { 
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/${currentPolygonToUpdate.id_geographic_area}`,
        method: "DELETE"
      })

      if(response.code === 200) {
        setShowDialog(false)
        setPolygonForWork(
          polygonsForWork.filter(polygon => polygon.id_geographic_area !== currentPolygonToUpdate.id_geographic_area))
      }
    }
  }

  // Handlers strategy autocomplete
  const handleSearchStrategyLevel = async (event: any, newInputValue: string | null) => {
    if (newInputValue !== null) {
      if(newInputValue!=="") setSearchStrategyLevel(newInputValue)
    }
  }

  const handleSelectStrategyLevel = async (event: any, newValue: string | null) => {
    const strategyLevelSelected: IStrategy|undefined = 
    arrayStrategyLevel.find(strategyLevel => strategyLevel.zone_type === newValue)
    if(strategyLevelSelected===undefined) setIdStrategy(undefined);
    else { 
      setIdStrategy(strategyLevelSelected.id_strategy)
    }
  }
  
  // Other handlers
  const handleCloseDialog = ():void => {
    setShowDialog(!showDialog)
    setManagePolygon(false)
  }

  return (<>
    <Dialog onClose={handleCloseDialog} open={showDialog}>
      <div className="p-5 pb-10 flex flex-col justify-center">
        <DialogTitle>
          { managePolygon ? 'Administrar area geografica' : 'Agregar area geografica' }
        </DialogTitle>
        <Input 
          onType={setGeographicAreaName} 
          inputValue={geographicAreaName}
          inputName="Nombre de area greografica"
          inputType="text"            
          />
        <div className="mt-3">
          <Autocomplete
            disablePortal
            id="input-strategy"
            onInputChange={(event: any, newInputValue: string | null) => 
              { handleSearchStrategyLevel(event, newInputValue) }}
            onChange={(event: any, newValue: string | null) => 
              handleSelectStrategyLevel(event, newValue) }
            value={
              searchStrategyLevel
            }
            options={ 
              arrayStrategyLevel[0]===undefined ? [] :
              arrayStrategyLevel.map((strategyLevel => strategyLevel.zone_type)) }
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Tipo de zona" />}
            />
        </div>
        <div className="flex flex-row justify-center">
          <Button 
            label={managePolygon ? "Actualizar" : "Agregar"}
            onClick={
              managePolygon ? handleOnSubmitUpdateGeographicArea : handleOnSubmitAddGeographicArea
            }
            />
            {
              managePolygon &&
              <Button 
                label="Eliminar"
                onClick={handleOnSubmitDeleteGeographicArea}
              />
            }
        </div>
      </div>
    </Dialog>
    
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
        onClick={(e: any) => handleClickMap(e)}
        onMouseMove={(e: any) => handleOnMouseMoveMap(e)}
        >
          {
            polygons.map((polygon) => 
            <PolygonF
              key={polygon.id_geographic_area}
              visible={true}
              editable={polygon.edtiable}
              // onMouseOut={(e:any) => {handleMouseUp(e, polygon)}}
              onMouseDown={(e:any) => {handleMouseDownPolygon(e)}}
              onMouseUp={(e:any) => {handleMouseUpPolygon(e, polygon)}}
              onRightClick={(e: any) => {handleRightClickLinePolyline(e, polygon.id_geographic_area)}}
              onClick={(e: any) => {handleDataClickPolygon(e, polygon)}} 
              onDblClick={(e: any) => {handleDbClickPolygon(e, polygon)}}
              onUnmount={(e: any) => {handleUnmountPolygon(e, polygon.id_geographic_area)}}
              path={polygon.coordinates}
            ></PolygonF>
            )
          }
          
          {
            line !== undefined &&
              <Polyline 
                editable
                onClick={(e: any) => { handleClickLine(e)} } 
                onMouseMove={(e:any) => handleMouseMoveLine(e)}
                onMouseDown={(e:any) => handleMouseDownLine(e)}
                onMouseUp={(e:any) => handleMouseUpLine(e)}
                onRightClick={(e:any) => handleRightClickLine(e)}
                path={line}
              />          
          }
    </GoogleMap>
  </>)
}

export default ManageGeographicAreasMapRender;