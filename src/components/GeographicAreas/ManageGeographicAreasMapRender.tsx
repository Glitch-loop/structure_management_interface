import { GoogleMap, PolygonF, Polyline } from "@react-google-maps/api"
import { useState, useEffect, useRef } from "react"
import {FiPlus, FiEye } from "react-icons/fi"
import '../../styles/global.css'
import { DialogTitle, Tooltip, Switch, responsiveFontSizes } from "@mui/material"
import {Dialog} from "@mui/material"
import Input from "../UIcomponents/Input"
import Button from "../UIcomponents/Button"
import requester from "../../helpers/Requester"
import { IRequest, LatLng, IGeographicArea, IStrategy } from "../../interfaces/interfaces"
import { Autocomplete, TextField } from "@mui/material"
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const initialGeographicAreaState:IGeographicArea = {
  id_geographic_area: 0,
  id_geographic_area_belongs: 0,
  geographic_area_name: "",
  id_member: 0,
  id_strategy: 0,
  coordinates: [],
  edtiable: false,
}

interface IStrategyShow extends IStrategy {
  show?: boolean
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

function ManageGeographicAreasMapRender() {
  //General States
  const [line, setLine] = useState<LatLng[]|undefined>(undefined);
  const [centerMap, setCenterMap] = useState<LatLng>({lat:20.64125680004875, lng: -105.22139813464167});
  
  //Line states (for new polygons)
  const [modifyCoordinateInLine, setModifyCoordinateInLine] = useState<number|undefined>(undefined);
  const [lastPointAdded, setLastPointAdded] = useState<LatLng|undefined>(undefined);
  
  //Polygon states
  const [polygons, setPolygons] = useState<IGeographicArea[]>([]);
  const [polygonsForWork, setPolygonForWork] = useState<IGeographicArea[]>([]);
  const [createNewPolygon, setCreateNewPolygon] = useState<boolean>(false)
  
  const [managePolygon, setManagePolygon] = useState<boolean>(false) //False = line, true = polygon
  const [currentPolygonToUpdate, setCurrentPolygonToUpdate] = useState<undefined|IGeographicArea>(undefined)
  const [currentPolygonPoint, setCurrentPolygonPoint] = useState<LatLng|undefined>(undefined)
  const [polygonToManage, setPolygonToManage] = useState<IGeographicArea|undefined>(undefined)

  //Logic for forms
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategyShow[]>([]);
  const [geographicArea, setGeographicArea] = useState<IGeographicArea>(initialGeographicAreaState);
  const [searchStrategyLevel, setSearchStrategyLevel] = useState<string>("");
  const [showDialog, setShowDialog] = useState<boolean>(false);
 
  //Logic areas visualization
  const [showVisualizationForm, setShowVisualizationForm] = useState<boolean>(false)
  
  const refCurrentPolygon = useRef<IGeographicArea|undefined>(undefined);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    getAllPolygons()
    .then((dataResponse:IGeographicArea[]) => {
      setPolygons(dataResponse)
      setPolygonForWork(dataResponse)
    });
    getStrategy()
    .then((dataStrategyLevels:IStrategy[]) => {
      /*
        Convert from IStrategy to IStrategyShow, this is for order to the map
        to show just the geographic areas type that area active, otherwise,
        the geographic areas won't be rendered.
      */
      const strategyLevels:IStrategyShow[] = dataStrategyLevels.filter(level => level.zone_type !== "");
      setArrayStrategyLevel(strategyLevels.map(strategyLevel => {
        strategyLevel.show = true;
        return strategyLevel
      }));
    })
  }, [])

  //Call to API
  const getAllPolygons = async ():Promise<IGeographicArea[]> => { 
    try {
      const response:IRequest<IGeographicArea[]> = await requester({
        url: `/geographicAreas`})

      if(response.code === 200)
        if(response.data !== undefined) 
          return response.data;

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar obtener las areas geograficas, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const getStrategy = async():Promise<IStrategy[]> => {
    try {
      const response:IRequest<IStrategy[]> = await requester({
        url: `/strategyLevels`,
        method: 'GET'
      })

      if(response.code === 200)
        if(response.data !== undefined) {
          return response.data;
        }

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar obtener los niveles de la estrategia, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const createNewGeographicArea = async(geographicArea:IGeographicArea):Promise<number> => {
    try {
      const data = {
        geographicAreaName: geographicArea.geographic_area_name,
        geographicAreaCoordinates: geographicArea.coordinates
      }
      if(data.geographicAreaName !== "") {
        const response:IRequest<any> = await requester({
          url: "/geographicAreas",
          method: "POST",
          data: data
        });

        if(response.code === 201)
          if(response.data !== undefined) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.success, 
              message: "Se ha agregado exitosamente el area geográfica"}}));  
            return response.data.id_geographic_area
          }
      }
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar crear la nueva area geográfica, intente nuevamente"}}));  

      return 0;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return 0;
    }
  }

  const updateGeographicAreaStrategyLevel = async (geographicArea: IGeographicArea):Promise<number> => {
    try {
      const {id_geographic_area, id_strategy} = geographicArea;
      const response:IRequest<IGeographicArea> = await requester({
        url: `/geographicAreas/strategicInformation/strategyLevel/${id_geographic_area}/${id_strategy}`,
        method: "PUT"
      });
      
      if(response.code !== 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un problema al intentar asignar el tipo de zona al area geográfica, intente nuevamente"}}));  
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Se ha asignado exitosamente el area el tipo de zona al area geográfica"}}));  
      }

      return response.code;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));      
      return 500;
    }
  }

  const updateGeographicAreaName = async (geographicArea: IGeographicArea):Promise<number> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/${geographicArea.id_geographic_area}`,
        method: 'PUT',
        data: {geographicAreaName: geographicArea.geographic_area_name}
      }) 
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se actualizado exitosamente el nombre del area geográfica"}}));  
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar actualizar el nombre del area geográfica, intente nuevamente"}}));  
        }
        return response.code;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return 500;
    }
  }

  const updateGeographicAreaCoordinates = async (geographicArea: IGeographicArea):Promise<number> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/coordinates/${geographicArea.id_geographic_area}`,
        method: 'PUT',
        data: {geographicAreaCoordinates: geographicArea.coordinates}
      })

      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se actualizado exitosamente las coordenadas del area geográfica"}}));  
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar actualizar las coordenadas del area geográfica, intente nuevamente"}}));  
        }
        return response.code;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return 500;
    }
  }

  const deleteGeographicArea = async (geographicArea: IGeographicArea):Promise<number> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/${geographicArea.id_geographic_area}`,
        method: "DELETE"
      })
      
      if (response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha borrado exitosamente el area geográfica"}}));  
        return response.code;
      }

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar eliminar la area geográfica, intente nuevamente"}}));  

      return response.code;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));      
      return 500;
    }
  }

  //Handlers
  //Handlres of MAP
  const handleClickMap = async (e: any) => {
    /*
      If the mode create new polygon is ON, then 
      each click on the map will be taking account as part 
      of the new polygon
    */
    if(createNewPolygon) {
      const newCoordinate:LatLng = getCoordinate(e);
      setManagePolygon(false);
      if(line!==undefined) setLine([...line, newCoordinate]);
    } else {
      setGeographicArea(initialGeographicAreaState)
    }

    /*
      This map disable the the mode "editable" for all polygons.
    */
    const newPolygonsForWorkArray:IGeographicArea[] = polygonsForWork
      .map(polygon => {polygon.edtiable = false; return polygon});
    
    /*
      The result of the map is stored in two states:
      - polygons: It is used to print in the map, also is the one that save the 
      user's modification.
      
      - polygonForWork: This state is used to save the polygons
      before of any modification, at the momento of update it is 
      used for validate modification.
    */
    setPolygons(newPolygonsForWorkArray);
    setPolygonForWork(newPolygonsForWorkArray);

    /*
      Reset the ref of the polygon that is currently being modified.
      This ref is used to know which polygon is being modified when it
      is being unmounted.
    */
    refCurrentPolygon.current = undefined;
  }

  const handleOnMouseMoveMap = (e: any): void => {
    /*
      First validate if there is being modified a geographic area,
      if it is, then, we find index polygonsForWorks (array where
      we stored the geographic areas modifications).
      Once we get the index, we update in the array, reset the current
      polygon to manage and update in "polygons" to render in the map.
    
    */
    if(polygonToManage !== undefined) {
      const index:number = polygonsForWork.findIndex(
        polygon => polygon.id_geographic_area === polygonToManage.id_geographic_area)
      polygonsForWork[index] = polygonToManage
      setPolygonToManage(undefined)
    }
    setPolygons(polygonsForWork)
  }

  //Handlres -- LINES
  //This function finish the new polygon
  const handleClickLine = (e: any): void => {
    /*
      If the polygon that is currently being created has
      3 or more vertices, then we get the coordinate of the last point.
      
      After to get the last coordinates we verify that the first and last
      ones conincide to close the polygon, if it is, we save that
      coordinates in the polygon, update the state to show the dialog and
      update the state to finish the mode "creating new polygon".
    */
    if(line !== undefined){
      if(line.length >= 3) {
        const terminalCoordinate:LatLng = getCoordinate(e);
        if(line[0].lat === terminalCoordinate.lat && line[0].lng === terminalCoordinate.lng) {
          line.push(terminalCoordinate)
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
      setGeographicArea(initialGeographicAreaState);
    }
  }

  const handleOnSubmitAddGeographicArea = async () => {
    geographicArea.coordinates = line;
    const idGeographicAreaAdded:number = await createNewGeographicArea(geographicArea)

    if(idGeographicAreaAdded !== 0) {
      geographicArea.id_geographic_area = idGeographicAreaAdded;
      
      if(geographicArea.id_geographic_area !== 0 && geographicArea.id_strategy !== 0) 
        if(await updateGeographicAreaStrategyLevel(geographicArea) !== 200) 
          geographicArea.id_strategy = 0
          

      polygonsForWork.push(geographicArea)
    }

    setShowDialog(false)
    setLine([]);
    setGeographicArea(initialGeographicAreaState);
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
    }

    setLine([]);
    setCreateNewPolygon(false);
  }

  const handleDbClickPolygon = (e: any, polygon: IGeographicArea): void => {
    if(polygon.id_strategy !== undefined && polygon.id_strategy !== null) {
      const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy === polygon.id_strategy)
      setSearchStrategyLevel(arrayStrategyLevel[index].zone_type)
    } else setSearchStrategyLevel("")
    
    setGeographicArea({
      ...geographicArea,
      id_geographic_area: polygon.id_geographic_area,
      id_strategy: polygon.id_strategy, 
      geographic_area_name: polygon.geographic_area_name
    })
    setCurrentPolygonToUpdate(polygon)
    setManagePolygon(true)
    setShowDialog(true)
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
          } 
        }
      }
    }
  }

  const handleMouseDownPolygon = (e:any) => { setCurrentPolygonPoint(getCoordinate(e)) }

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
    if(currentPolygonToUpdate!==undefined) {
      const indexPolygonUpdating:number = polygons.findIndex(
        polygon => polygon.id_geographic_area === currentPolygonToUpdate.id_geographic_area);
      
      if(polygons[indexPolygonUpdating].geographic_area_name !== geographicArea.geographic_area_name)
        if(await updateGeographicAreaName(geographicArea) === 200) 
          polygons[indexPolygonUpdating].geographic_area_name = geographicArea.geographic_area_name;
    
      if(await updateGeographicAreaCoordinates(geographicArea) === 200) 
        polygons[indexPolygonUpdating].coordinates = currentPolygonToUpdate.coordinates;
    
      if(geographicArea.id_strategy !== 0) 
        if(polygons[indexPolygonUpdating].id_strategy !== geographicArea.id_strategy) 
          if(await updateGeographicAreaStrategyLevel(geographicArea) === 200) 
            polygons[indexPolygonUpdating].id_strategy = geographicArea.id_strategy;
        
      setGeographicArea(initialGeographicAreaState);
      setShowDialog(false);
      setPolygons(polygons);
    }
  }

  const handleOnSubmitDeleteGeographicArea = async (e: any) => {
    if(geographicArea.id_geographic_area!==0) {
      if(await deleteGeographicArea(geographicArea) === 200) {
        setPolygonForWork(
          polygonsForWork
          .filter(polygon => polygon.id_geographic_area !== geographicArea.id_geographic_area));
      }
      setGeographicArea(initialGeographicAreaState);
      setShowDialog(false);
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
    if(strategyLevelSelected===undefined) setGeographicArea({...geographicArea, id_strategy: 0})
    else { 
      setGeographicArea({...geographicArea, id_strategy: strategyLevelSelected.id_strategy})
    }
  }
  
  // Other handlers
  const handleCloseDialog = ():void => {
    setShowDialog(!showDialog)
    setManagePolygon(false)
  }
  
  const handleSwitchShowZoneType = (e: any, strategyLevelSwitch: IStrategyShow):void => {
    setArrayStrategyLevel(
      arrayStrategyLevel.map(stretegyLevel => {
        if(stretegyLevel.id_strategy === strategyLevelSwitch.id_strategy) {
          if(stretegyLevel.show) stretegyLevel.show = false
          else stretegyLevel.show = true
        }
        return stretegyLevel
      })
    )
  }

  return (<>
    <Dialog onClose={handleCloseDialog} open={showDialog}>
      <div className="p-5 pb-10 flex flex-col justify-center">
        <DialogTitle>
          { managePolygon ? 'Administrar area geográfica' : 'Agregar area geográfica' }
        </DialogTitle>
        <Input 
          onType={setGeographicArea}
          objectValue={geographicArea} 
          inputName={"geographic_area_name"}
          placeholder={'Nombre de area greografica'}
          inputType={'text'}
          required={true}
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
                colorButton={1}
              />
            }
        </div>
      </div>
    </Dialog>
    
    <Dialog onClose={() => setShowVisualizationForm(false)} open={showVisualizationForm}>
      <DialogTitle>Visualizar areas</DialogTitle>   
      <div className="p-5 pb-10 flex flex-col justify-center">
        {
          arrayStrategyLevel.map(strategyLevel => {
            return <div className="flex row justify-between">
              <p className="text-lg">{strategyLevel.zone_type}</p>
              <Switch 
                checked={strategyLevel.show}
                onChange={(e:any) => handleSwitchShowZoneType(e, strategyLevel)}
              />
            </div>
          })
        }
      </div>
    </Dialog>

    <div className="absolute flex-col w-full h-full justify-center">
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
    <div className="absolute flex-col w-full h-full justify-center">
      <Tooltip title="Crear nueva area">
        <button
          onClick={ () => setShowVisualizationForm(true) } 
          className={`z-10 absolute p-5 rounded-full hover:bg-lime-800 bottom-0 left-0 mb-28 ml-3 ${showVisualizationForm ? "bg-lime-800" : "bg-lime-600"}`} >
          <div className="text-white">
            <FiEye />
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
              visible={polygonVisible(arrayStrategyLevel, polygon)}
              editable={polygon.edtiable}
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