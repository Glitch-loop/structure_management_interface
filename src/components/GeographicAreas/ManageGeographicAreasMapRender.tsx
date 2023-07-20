import { GoogleMap, PolygonF, Polyline } from "@react-google-maps/api"
import { useState, useEffect, useRef, useDebugValue } from "react"
import {FiPlus, FiEye } from "react-icons/fi"
import '../../styles/global.css'
import { DialogTitle, Tooltip, Switch } from "@mui/material"
import {Dialog} from "@mui/material"
import Input from "../UIcomponents/Input"
import Button from "../UIcomponents/Button"
import requester from "../../helpers/Requester"
import { IRequest, LatLng, IGeographicArea, IStrategy, IColor, IStructure } from "../../interfaces/interfaces"
import { Autocomplete, TextField } from "@mui/material"
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { randomNumber } from "../../utils/utils";
import { IoAppsSharp } from "react-icons/io5";
import Searcher from "../UIcomponents/Searcher";

const responseError:IRequest<undefined> = {
  code: 500,
  message: "Internal error",
  data: undefined
}

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
  const [currentPolygonPoint, setCurrentPolygonPoint] = useState<LatLng|undefined>(undefined)
  const [polygonToManage, setPolygonToManage] = useState<IGeographicArea|undefined>(undefined)

  //Logic for forms
  //Geographic area's strategy level 
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategyShow[]>([]);
  const [geographicArea, setGeographicArea] = useState<IGeographicArea>(initialGeographicAreaState);
  const [searchStrategyLevel, setSearchStrategyLevel] = useState<string>("");
  
  //Geographic area belongs to
  const [searchGeographicAreaBelongsTo, setSearchGeographicAreaBelongsTo] = useState<string>("");
  const [arraySearchGeographicAreaBelongsTo, setArraySearchGeographicAreaBelongsTo] = useState<IStructure[]>([]);

  //State for geographic area visualization
  const [showAllGeographicAreas, setShowAllGeographicAreas] = useState<boolean>(false);

  // Form
  const [showDialog, setShowDialog] = useState<boolean>(false);
 
  //Logic areas visualization
  const [showVisualizationForm, setShowVisualizationForm] = useState<boolean>(false)
  
  //States for searcher
  const [searchGeographicAreas, setSearchGeographicAreas] = useState<IStructure[]>([]);
  const [storeResponseSearchGeographicAreas, setStoreResponseSearchGeographicAreas] = useState<IStructure[]>([]);

  const refCurrentPolygon = useRef<IGeographicArea|undefined>(undefined);

  const [polygonColor, setPolygonColor] = useState<any[]>([]);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
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

      const definePolygonColor:any[] = [];
      strategyLevels.forEach(level => {
        definePolygonColor.push({
          id_strategy: level.id_strategy,
          options: getColorForPolygon()
        })
      })

      setPolygonColor(definePolygonColor);
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

  const createNewGeographicArea = async(geographicArea:IGeographicArea):Promise<IRequest<any>> => {
    const wrongResponse:IRequest<any> = {
      message: "There was an error",
      code: 400,
      data: {id_geographic_area: 0}
    }
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
            return response
          }
      }

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar crear la nueva area geográfica, intente nuevamente"}}));  
      return wrongResponse;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return wrongResponse;
    }
  }

  const updateGeographicAreaStrategyLevel = async (geographicArea: IGeographicArea):Promise<IRequest<undefined>> => {
    try {
      const {id_geographic_area, id_strategy} = geographicArea;
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/strategicInformation/strategyLevel/${id_geographic_area}/${id_strategy}`,
        method: "PUT"
      });
      
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha asignado exitosamente el area el tipo de zona al area geográfica"}}));  
      }

      return response;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));      
      return responseError;
    }
  }

  const updateGeographicAreaName = async (geographicArea: IGeographicArea):Promise<IRequest<undefined>> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/${geographicArea.id_geographic_area}`,
        method: 'PUT',
        data: {geographicAreaName: geographicArea.geographic_area_name}
      }) 
      if(response.code === 400 && response.message === "The geographic area name can't be longer than 60 characters") {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "El nombre del area geográfica no puede ser mayor a 60 caracteres"}}));        
      } else { 
        if(response.code === 400) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Ha habido un error al intentar actualizar el nombre del area geográfica, intente nuevamente"}}));
        }
      }

      return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
    }
  }

  const updateGeographicAreaCoordinates = async (geographicArea: IGeographicArea):Promise<IRequest<undefined>> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/coordinates/${geographicArea.id_geographic_area}`,
        method: 'PUT',
        data: {geographicAreaCoordinates: geographicArea.coordinates}
      })

      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar actualizar las coordenadas del area geográfica, intente nuevamente"}}));  
        }
        return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
    }
  }

  const updateGeographicAreaBelongsTo = async (geographicArea: IGeographicArea):Promise<IRequest<undefined>> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/strategicInformation/areaBelongs/${geographicArea.id_geographic_area}/${geographicArea.id_geographic_area_belongs}`,
        method: 'PUT'
      })
      console.log(response);
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar actualizar el area geográfica a la que pertenece, intente nuevamente"}}));  
        }
        return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
    }
  }

  const deleteGeographicAreaBelongsTo = async (geographicArea: IGeographicArea):Promise<IRequest<undefined>> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/geographicAreas/strategicInformation/areaBelongs/${geographicArea.id_geographic_area}`,
        method: 'DELETE'
      })
      console.log(response);
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar remover el vinculo entre el area geográfica y el area geográfica donde pertenece, intente nuevamente"}}));  
        }
        return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
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

  const getGeographicAreaBelongsTo = async(geographicAreaName: string, idStrategy:number):Promise<IStructure[]> =>{
    try {
      const response: IRequest<IStructure[]> = await requester({
        url: `/geographicAreas/strategicInformation/belongs/${geographicAreaName}/${idStrategy}`,
        method: 'GET',
      })
      if(response.code === 200) {
        if(response.data !== undefined) return response.data;
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las areas geograficas, intente mas tarde"}})); 
      }
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
      return [];
    }
  }

  const getGeographicAreaByID = async(idGeographicArea: number):Promise<IGeographicArea[]> => {
    try {
      const response: IRequest<IGeographicArea[]> = await requester({
        url: `/geographicAreas/${idGeographicArea}`,
        method: 'GET',
      })
      if(response.code === 200) {
        if(response.data !== undefined) return response.data;
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las areas geograficas, intente mas tarde"}})); 
      }
      return [ initialGeographicAreaState ];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
      return [initialGeographicAreaState];
    }
  }

  const searchGeographicArea = async(stringToSearch: string):Promise<IStructure[]> =>{
    try {
      const response: IRequest<IStructure[]> = await requester({
        url: `/geographicAreas/search/${stringToSearch}`,
        method: 'GET',
      })
      if(response.code === 200) {
        if(response.data !== undefined) return response.data;
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las areas geograficas, intente mas tarde"}})); 
      }
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
      return [];
    }
  }

  const getGeographicAreasInside = async(idGeographicArea: number):Promise<IStructure[]> =>{
    try {
      const response: IRequest<IStructure[]> = await requester({
        url: `/geographicAreas/inside/${idGeographicArea}`,
        method: 'GET',
      })
      if(response.code === 200) {
        if(response.data !== undefined) return response.data;
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar el area geográfica, intente mas tarde"}})); 
      }
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
      return [];
    }
  }

  //Handlers
  //Handlres of MAP
  const handleClickMap = async (e: any) => {
    /*      
      If the mode "create polygon" is ON, then 
      each click on the map will be taken account as part 
      of the new polygon (if the user clicks other polygon, 
      that click isn't going be taken as a part of the polygon).
    */
    if(createNewPolygon) {
      const newCoordinate:LatLng = getCoordinate(e);
      setManagePolygon(false);
      if(line!==undefined) setLine([...line, newCoordinate]);
    } else {
      resetStates();
    }

    /*
      This map disable the mode "editable" for all polygons.
      When editable is false, the user can't modify the polygons.
    */
    const newPolygonsForWorkArray:IGeographicArea[] = polygonsForWork
      .map(polygon => {polygon.edtiable = false; return polygon});
    
    /*
      The result of the map is stored in two states:
      - polygons state: It is used to print in the map, 
      also is the one that save the user's modifications.
      
      - polygonForWork state: This state is used to save the polygons
      before of any modification, we can see it as the initial state
      before modifications.
      When modifications ends, those modifications are stored in
      this state
    */
    setPolygons(newPolygonsForWorkArray);
    setPolygonForWork(newPolygonsForWorkArray);

    /*
      Reset the ref of the polygon that is currently being modified.
      This ref is used to know which polygon is being modified when it
      is being "unmounted".
      Becuase it is complicated to calculate where is the new "vertice"
      or which vertice is being removed, we use the "object" (Polygon)
      that returns the event "unmounted", object which returns the 
      current "state of the polygon"
    */
    refCurrentPolygon.current = undefined;
  }

  const handleOnMouseMoveMap = (): void => {
    /*
      First, validate if there is being modified a geographic area,
      if it is, then, we find its index in polygonsForWorks (array where
      we stored the geographic areas modifications).
      Once we get the index, we update in the array, reset the current
      polygon to manage and update in "polygons" to render in the map.

      In short, we constantly are validating (and saving) changes in the 
      polygons. 
    */
    if(polygonToManage !== undefined) {
      const index:number = polygonsForWork.findIndex(
        polygon => polygon.id_geographic_area === polygonToManage.id_geographic_area)
      polygonsForWork[index] = polygonToManage
      setPolygonToManage(undefined)
    }
    setPolygons(polygonsForWork)
  }

  //Handler to visualizate geographic areas
  const handleVisualizateAllGeographicArea = async ():Promise<void> => {
    const dataResponse:IGeographicArea[] = await getAllPolygons();
    setPolygons(dataResponse);
    setPolygonForWork(dataResponse);
    setShowAllGeographicAreas(true);
  }

  //Handlres -- LINES
  /*
    This function is the one that enable and disable the mode to "create a new area"
  */
  const handleCreateNewArea = (): void => {
    if(createNewPolygon) {
      //In this case the "create new area" is being OFF
      setCreateNewPolygon(false); 
    } else {
      //In this case the "create new area" is being ON
      setCreateNewPolygon(true);
      setSearchStrategyLevel("");
      setGeographicArea(initialGeographicAreaState);
    }
    setLine([]);
  }
  
  /*
    This function determines if the user wants to add a new coordinate to the line
    or, if the user wants to modify an existing coordinate inside the line
  */
  const handleMouseDownLine = (e: any): void => {
    // Get the current coordinates (where the finger downm)
    const terminalCoordinate:LatLng = getCoordinate(e); 

    if(line!==undefined) {
      const index: number = line.findIndex((point) => {
        if(point.lat === terminalCoordinate.lat && point.lng === terminalCoordinate.lng) 
          return true
        else return false
      })
      
      /*
        If "index" different -1 means that the user is going to update an existing node so we stored the
        index of the coordinate that is being modfied, otherwise a new node is going to be added.
      
      */    
      index !== -1 ? setModifyCoordinateInLine(index) : setModifyCoordinateInLine(undefined)
    }

  }

  /*
    This function finishes the procedure began in "handleMouseDownLine" function.
    This function is when the user up his finger from the mouse.
    There are two posibilities, either the user is adding a new coordinate or 
    the user is updating an existing coordinate within the line.
  */
  const handleMouseUpLine = (e:any): void => {
    if(line!==undefined) {
      const newCoordinate:LatLng = getCoordinate(e); // Get the current coordinate (where the finger up)
  
      if(modifyCoordinateInLine !== undefined) {
        //That means that an existing cordinate is being updated
        line[modifyCoordinateInLine] = newCoordinate; 
      } else {      
        //That means a new coordinate is being added to the line
        setLastPointAdded(newCoordinate)
        line.push(newCoordinate)
      }
      
      // Save the line in the state (to render) with the modifcations.
      setLine(line)
    }
  }

  // This function allows to the user to "delete" a point in the line
  const handleRightClickLine = (e:any):void => {
    if(line!== undefined) {
      const coordinateToDelete = getCoordinate(e); //Get the coordinate
      if(line.length === 1) 
      setLine([]) // If the line has 1 point, that means that the user delete all the line.
      else {
      // Otherwise, we filter all the point that conforms the line, excluding the point that the user deleted
      setLine(line.filter(point => {
        if(point.lat !== coordinateToDelete.lat && point.lng !== coordinateToDelete.lng) 
          return true
        else return false
      }))
    }
    }
  }

  //This function finish the new polygon
  const handleClickLine = (e: any): void => {
    /*
      If the polygon that is currently being created has
      3 or more vertices, then we get the coordinate of the last point.
      
      After to get the last coordinates we verify that the first and last
      ones conincide to close the polygon, if it is:
      1. Save these coordinates in the polygon.
      2. Update the state to show the dialog (in this case to open it)
      3. Update the state to finish (or disable) the mode "creating new polygon".
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

  /*
    //TODO fix the alghoritm
    This is an especial function (you can see it as a monitor) which care that the line is
    organized has it should be.

    When a new coordinate is added at the end of the line, there isn't a problem, 
    but when it is added in the middle of it, we have that the new point that 
    supposedly must be at the middle of the line, it is in the at end of it 
    (that because the workflow of the other functions), so it "breaks" the line.
  */
  const handleMouseMoveLine = (e: any):void => {
    if(line!==undefined) {
      let vertexInLine:number = e.vertex; // Get the vertex of the vertex that is being modified       
      if(lastPointAdded !== undefined && line[0] !== undefined) {
        /*
          If the last point added was a modification and there is a line (at least 1 coordinate stored).
          Sorted the point to conform the line, taking account that the has the vertex must be according
          to the event says.
        */
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


  //This function is when geographic area has been finished
  const handleOnSubmitAddGeographicArea = async ():Promise<void> => {
    if(geographicArea.geographic_area_name === "") {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "El nombre del area geografica no puede estar vacío"}})); 
      setShowDialog(false);
      return;
    }

    geographicArea.coordinates = line; //Get the lines

    //Create the geographic area
    const responseBasicData:IRequest<any> = await createNewGeographicArea(geographicArea)

    let idGeographicAreaAdded = 0;
    if(responseBasicData.data !== undefined) 
      idGeographicAreaAdded = responseBasicData.data.id_geographic_area;

    if(idGeographicAreaAdded !== 0 && idGeographicAreaAdded !== undefined) {
      geographicArea.id_geographic_area = idGeographicAreaAdded; //Get the ID of the geographic area created
      
      /*
        If the geographic area was created successfully and chose a 'zone_type' for the area,
        then we update the type of zone of the area.
      */
      if(geographicArea.id_strategy !== 0) {
        const response:IRequest<undefined> = await updateGeographicAreaStrategyLevel(geographicArea);

        if(response.code !== 200) 
          geographicArea.id_strategy = 0
      } else {
        geographicArea.id_strategy = undefined;
      }
      
      if(geographicArea.id_geographic_area_belongs !== 0) {
        const response:IRequest<undefined> = await updateGeographicAreaBelongsTo(geographicArea);
        if(response.code !== 200) 
          geographicArea.id_geographic_area_belongs = 0
      } else {
        geographicArea.id_strategy = undefined;
      }
      
      polygonsForWork.push(geographicArea); //Save the new area to render.
    }

    //Reset the variables (this for the next time that the user wants to create other. area)
    setShowDialog(false);
    setLine([]);
    resetStates();
  }

  // Handlers -- POLYGON
  /*
    This function ensures that the user can modify one polygon at the time.
  */
  const handleDataClickPolygon = (e: any, polygon: IGeographicArea):void => {
    const idPolygon = polygon.id_geographic_area;
    if(idPolygon!==undefined) {

      //Ensure that there is just one polygon to update
      const newPolygons = polygons.map(polygon => {polygon.edtiable = false; return polygon});

      //Find the polygon's index to update
      const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon);

      // Make able to modify the polygon that currently the user is modifed.
      newPolygons[index].edtiable = true; 
    }

    // Turn off the create new polygon mode
    setLine([]);
    setCreateNewPolygon(false);
  }

  /*
    This function is to show the dialog where it'll be showed  the current polygon's information,
    either to modified it or to delete it
  */
  const handleDbClickPolygon = async(e: any, polygon: IGeographicArea):Promise<void> => {
    if(polygon.id_strategy !== undefined && polygon.id_strategy !== null) {
      /*
        The polygon has a zone type assigned (in short, find the name of the zone type 
        to be displayed in the dialog)
      */
      const index:number = arrayStrategyLevel
        .findIndex(strategyLevel => strategyLevel.id_strategy === polygon.id_strategy);
      setSearchStrategyLevel(arrayStrategyLevel[index].zone_type);
      
      /*
        Get geographic area that belongs the polygon (if the polygon belongs, we going to set in the geographic area belongs display )
      */
      
      if (polygon.id_geographic_area_belongs !== 0 
       && polygon.id_geographic_area_belongs !== undefined
       && polygon.id_geographic_area_belongs !== null) {
        const geographicAreaThatBelongs = await getGeographicAreaByID(polygon.id_geographic_area_belongs)
        
        if(geographicAreaThatBelongs[0].geographic_area_name !== undefined
          && geographicAreaThatBelongs[0].geographic_area_name !== null)
          setSearchGeographicAreaBelongsTo(
            `${geographicAreaThatBelongs[0].geographic_area_name} - ${geographicAreaThatBelongs[0].id_geographic_area}`);
          
      } else {
        setSearchGeographicAreaBelongsTo("");
        setArraySearchGeographicAreaBelongsTo([]);
      }
    } else {
      setSearchStrategyLevel(""); // The polygon doesn't have a type zone assigned
    } 
    
    // Save the current information of the polygon.
    /*
      This state makes to know to the system that a polygon may suffer modifications.
      If the polygon suffer any modification, then the system is going to be stored that modification
      for "possibly" update it (if the user confirm the update).
    */
   console.log("Current polygon: ", polygon)
    setGeographicArea({
      ...geographicArea,
      id_geographic_area: polygon.id_geographic_area,
      id_strategy: polygon.id_strategy, 
      id_geographic_area_belongs: 
        (polygon.id_geographic_area_belongs !== 0 ? 
            polygon.id_geographic_area_belongs: 0),
      geographic_area_name: polygon.geographic_area_name,
      coordinates: polygon.coordinates
    });

    // Activate the polygon mange mode
    setManagePolygon(true)
    // Show the dialog
    setShowDialog(true)
  }

  /*
    This function to delete a point that conforms the polygon line.
  */
  const handleRightClickLinePolyline = (e:any, idPolygon: number|undefined):void => {
    if(idPolygon!== undefined) {
      const coordinateToDelete = getCoordinate(e); // Get point (coordinate) to delete 
      
      //Get index of the geographic area which the user is deleting the point
      const index = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon);
      if(polygons[index].coordinates !== undefined) { 
        
        /*
          Get the geographic area without the point that was deleted.
          In other words, get all the points of the polygon except that one that the user deleted.
        */
        const newPolygon:LatLng[]|undefined = polygons[index]
          .coordinates?.filter(coordinate => {
            if(coordinate.lat !== coordinateToDelete.lat && 
              coordinate.lng !== coordinateToDelete.lng) return true
            else return false
          });

        //If the polygon is not undefined 
        if(newPolygon !== undefined) {
          /*
            If the resulting polygon has 3 or more point, store it, otherwise don't
          */
          if(newPolygon.length >= 3) {
            polygons[index].coordinates = newPolygon;
            const newGeographicArea:IGeographicArea[] = polygons;

            setPolygons(newGeographicArea)
          } 
        }
      }
    }
  }

  /*
    This function is the start of the procedure to modify a polygon (update (an existing point) 
    or add a point), in this we get the point that the user begin to move 
    (that it will belong to the polygon) and store it for when the user up the finger from the mouse.
  */
  const handleMouseDownPolygon = (e:any) => { setCurrentPolygonPoint(getCoordinate(e)) }

  /*
    This the final of the procedure to add or update a point of the polygon, in this function
    we determine if the user is updating a point or if he is adding a new one to the polygon.
  */
  const handleMouseUpPolygon = (e:any, currentPolygon: IGeographicArea): void => {
    const idPolygon = currentPolygon.id_geographic_area;
    const editable =  currentPolygon.edtiable;
    const coordinates = getCoordinate(e);
    if(idPolygon!==undefined && 
      editable && 
      coordinates.lat !== currentPolygonPoint?.lat &&
      coordinates.lng !== currentPolygonPoint?.lng) {
      /*
        The previous if means:
        if the polygon exist, if it is editable, and if the coordinates where the user end to drag
        are different from where he started.
      */

      //Find the polygon to update
      const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon);

        /*
        Save it in a ref
        Actually what it want to know is the polygon itself, being punctual its id_geographic_area,
        that for when we unmounted the polygon
      */
      refCurrentPolygon.current = polygons[index]; 

      /*
        Delete the polygon to update.
        This is to provke an unmountin event.
      */
      setPolygons(polygons.filter(polygon => polygon.id_geographic_area !== idPolygon));
    } else { 
      //Otherwise we simply update the polygon to it doesn't be able to be modifed,
      const index:number = polygons.findIndex(polygon => polygon.id_geographic_area === idPolygon);
      polygons[index].edtiable = false;
      setPolygons(polygons);
    }
  }

  /*
    We use the unmounting event to have the current polygon's information, otherwise 
    we would have to calculate the add, update and delete points of the polygon.
    In short, this is the easiest way to get the current polygon points.
  */
  const handleUnmountPolygon = async (e:any, idPolygon: number|undefined) => {
    console.log("UNMOUNTING")
    console.log("This is ref: ", refCurrentPolygon)
    if(idPolygon !== undefined) {
      //This process is to update the polygon (add, delete, move vertices [points]).
      if(refCurrentPolygon!==undefined) {
        //Get current polygon
        const currentCoordinatesPolygon:any = e.getPath();
        if(refCurrentPolygon.current?.coordinates != undefined){
          //If there are coordinates, save the new polygon 
          refCurrentPolygon.current.coordinates = getPolygonCoordinatesInUnmount(currentCoordinatesPolygon);

          //Find the geographic area in the array to save it
          const index:number = polygons
            .findIndex(polygon => polygon.id_geographic_area === refCurrentPolygon.current?.id_geographic_area);
          
          //Saving the polygon with new points
          polygons[index].coordinates = refCurrentPolygon.current.coordinates;
          
          //Save in the state
          setPolygonToManage(polygons[index]);
        }
      }
    }
  }

  const handleOnSubmitUpdateGeographicArea = async (e: any) => {
    let responseUpdate:IRequest<undefined> = {
      message: "Update done successfully",
      code: 200,
      data: undefined
    }

    //Verify that there aren't wrong data in the fields
    if(geographicArea.id_strategy === 0){
      //User cannot let empty the zone type field
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Haz olvidado asignar que 'tipo de zona' es el area geográfica"}})); 
      resetStates();
      setShowDialog(false);
      setPolygons(polygons);
      return;
    }

    if(geographicArea.geographic_area_name === ""){
      //User cannot let empty the zone type field
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "El nombre del area geográfica no puede estar vacio"}})); 
      resetStates();
      setShowDialog(false);
      setPolygons(polygons);
      return;
    }

    const indexPolygonUpdating:number = polygons.findIndex(
      polygon => polygon.id_geographic_area === geographicArea.id_geographic_area);
    const previousePolygon:IGeographicArea = polygons[indexPolygonUpdating];

    //Basic information for the area
    // Name
    if(previousePolygon.geographic_area_name !== geographicArea.geographic_area_name) {
      responseUpdate = await updateGeographicAreaName(geographicArea);
      if(responseUpdate.code === 200) {
        polygons[indexPolygonUpdating].geographic_area_name = 
          geographicArea.geographic_area_name;
      }
      
    }
    
    // Coordinates
    responseUpdate = await updateGeographicAreaCoordinates(geographicArea);

    if(responseUpdate.code === 200) 
      polygons[indexPolygonUpdating].coordinates = geographicArea.coordinates;
  
    /*Strategic information*/
    // Zone type
    if(previousePolygon.id_strategy !== geographicArea.id_strategy) {
      responseUpdate = await updateGeographicAreaStrategyLevel(geographicArea)
      if(responseUpdate.code === 200) {
        polygons[indexPolygonUpdating].id_strategy = geographicArea.id_strategy;
        /* We need to reset these fields because the geographic area level changed */
        polygons[indexPolygonUpdating].id_geographic_area_belongs = 0;
        geographicArea.id_geographic_area_belongs = 0;
      }
    }

    // Geographic areas where belongs
    if(geographicArea.id_geographic_area_belongs 
        !== polygons[indexPolygonUpdating].id_geographic_area_belongs) {

        if(geographicArea.id_geographic_area_belongs !== null 
          && geographicArea.id_geographic_area_belongs !== 0) {
            //The user choose a geographic area where belongs our geographic area
            responseUpdate = await updateGeographicAreaBelongsTo(geographicArea);
          } else {
            /*
              The user remove the bind between the geographica area and the geographic area
              where belongs
            */
            responseUpdate = await deleteGeographicAreaBelongsTo(geographicArea);
          }

          if(responseUpdate.code === 200) {
            polygons[indexPolygonUpdating].id_geographic_area_belongs = 
              geographicArea.id_geographic_area_belongs;
            polygons[indexPolygonUpdating].geographic_area_name = 
              geographicArea.geographic_area_name;
          }

        }

    //This is in case that all the calls were complete successfully
    if(responseUpdate.code === 200) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.success, 
        message: "Se ha actualizado exitosamente el area geográfica"}})); 
    }

    resetStates();
    setShowDialog(false);
    setPolygons(polygons);
  }

  const handleOnSubmitDeleteGeographicArea = async (e: any) => {
    if(geographicArea.id_geographic_area!==0) {
      if(await deleteGeographicArea(geographicArea) === 200) {
        const newSetPolygons:IGeographicArea[] = polygonsForWork
        .filter(polygon => polygon.id_geographic_area !== geographicArea.id_geographic_area)
        setPolygonForWork(newSetPolygons);
        setPolygons(newSetPolygons);
        refCurrentPolygon.current = geographicArea;
      }
      setGeographicArea(initialGeographicAreaState);
      setShowDialog(false);
    }
  }

  // Handlers strategy autocomplete
  const handleSearchStrategyLevel = async (event: any, newInputValue: string | null) => {
    if (newInputValue !== null) 
      if(newInputValue!=="") setSearchStrategyLevel(newInputValue)
  }

  const handleSelectStrategyLevel = async (event: any, newValue: string | null) => {
    if(newValue === null){ 
      //The user delete the strategy level selected, also delete the geographic area where it belongs
      setGeographicArea({...geographicArea, 
        id_strategy: 0, 
        id_geographic_area_belongs: 0})
      setSearchStrategyLevel("");
    } else {
      const strategyLevelSelected: IStrategy|undefined = 
      arrayStrategyLevel.find(strategyLevel => strategyLevel.zone_type === newValue)
      if(strategyLevelSelected===undefined) {
        setGeographicArea({...geographicArea, id_strategy: 0});
        setGeographicArea({...geographicArea, 
          id_strategy: 0, 
          id_geographic_area_belongs: 0})
        setSearchStrategyLevel("");
      }
      else { 
        setGeographicArea({...geographicArea, 
          id_strategy: strategyLevelSelected.id_strategy});
      }
    }
    setSearchGeographicAreaBelongsTo("");
    setArraySearchGeographicAreaBelongsTo([]);
  }
  
  // Handler geographic area autocomplete
  const handleSearchGeographicAreaBelongsTo = async (event: any, newInputValue: string | null) => {
    console.log(newInputValue)
    if(newInputValue !== null) {
      //Save the current user's search
      setSearchGeographicAreaBelongsTo(newInputValue) 
      //If the user doesn't search anything, delete the current results 
      if(newInputValue==='') setArraySearchGeographicAreaBelongsTo([]) 

      /*
        If the array of results is empty and the user is searcher something, 
        make a request to backend to search what the user is searching.
      */
      if(arraySearchGeographicAreaBelongsTo[0] === undefined 
        && newInputValue !== ''
        && geographicArea.id_strategy !== 0
        && geographicArea.id_strategy !== undefined)
          setArraySearchGeographicAreaBelongsTo(
            await getGeographicAreaBelongsTo(newInputValue, geographicArea.id_strategy))
    }
  }

  const handleSelectGeographicAreaBelongsTo = async (event: any, newValue: string | null|undefined) => {
    const geographicAreaSelected: IStructure|undefined = 
    arraySearchGeographicAreaBelongsTo
      .find(strategyLevel => 
        `${strategyLevel.geographic_area_name} - ${strategyLevel.id_geographic_area}` === newValue)
    if(geographicAreaSelected===undefined) 
      setGeographicArea({...geographicArea, id_geographic_area_belongs: 0})
    else { 
      setGeographicArea({...geographicArea, 
        id_geographic_area_belongs: geographicAreaSelected.id_geographic_area})
    }
  }

  // Other handlers
  const handleCloseDialog = ():void => {
    setShowDialog(!showDialog)
    setManagePolygon(false)
  }
  
  /*
    This function is to determine which kind of zones the user want to see.
  */
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

  //Handlers for searcher
  const onSearchTypeGeographicArea = async(stringToSearch: string) => {
    if(stringToSearch === "") {
      setStoreResponseSearchGeographicAreas([]);
      setSearchGeographicAreas([]);
    } else {
      if(storeResponseSearchGeographicAreas[0] !== undefined) {
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
      
        const geographicAreaToShow:IStructure[] = storeResponseSearchGeographicAreas.filter(geographicArea => {
            const name = `${geographicArea.first_name} ${geographicArea.last_name}`;
            const geographic_area_name = `${geographicArea.geographic_area_name}`;
            
            if(
                re.test(name.toLocaleLowerCase()) === true ||
                re.test(geographic_area_name.toLocaleLowerCase()) === true
              ) 
              return geographicArea;
          })
        
        if(geographicAreaToShow !== undefined) setSearchGeographicAreas(geographicAreaToShow);
        else setSearchGeographicAreas([]);  
      } else {
        const responseData:IStructure[] = await searchGeographicArea(stringToSearch);
        setStoreResponseSearchGeographicAreas(responseData);
        setSearchGeographicAreas(responseData);
      }
    }
  }

  const selectOptionMember = async (idGeographicArea: number) => {
    const findGeographicArea:undefined|IStructure = storeResponseSearchGeographicAreas
      .find(geographicArea => geographicArea.id_geographic_area === idGeographicArea);

    //Ask the geographic area
    if(findGeographicArea !== undefined) 
      if(findGeographicArea.id_geographic_area !== undefined) {
        const dataResponse:IGeographicArea[] = 
          await getGeographicAreasInside(findGeographicArea.id_geographic_area);
        setPolygons(dataResponse);
        setPolygonForWork(dataResponse);
        setShowAllGeographicAreas(false);
      }


    setSearchGeographicAreas([]);
    setStoreResponseSearchGeographicAreas([]);
  }

  // Auxiliar functions
  const resetStates = ():void => {
    setGeographicArea(initialGeographicAreaState);
    setArraySearchGeographicAreaBelongsTo([]);
    setSearchGeographicAreaBelongsTo("");
  }

  const showGeographicAreaBelongsTo = (geographicArea: IGeographicArea):boolean => {
    if(geographicArea.id_strategy !== undefined) {
      const strategyLevel:IStrategy|undefined = arrayStrategyLevel
        .find(level => level.id_strategy === geographicArea.id_strategy);
      
      if(strategyLevel !== undefined) 
        if(strategyLevel.cardinality_level > 1)
          return true; 
    }
    return false
  }

  return (<>
    <Dialog onClose={handleCloseDialog} open={showDialog}>
      <div className="p-5 pb-10 flex flex-col justify-center text-center">
        <DialogTitle>
          { managePolygon ? 'Administrar area geográfica' : 'Agregar area geográfica' }
        </DialogTitle>
        {
          managePolygon &&
            <p>ID del area geográfica: 
              <span className="ml-2 italic font-bold">
                {geographicArea.id_geographic_area}
              </span>
            </p>
        }
        <Input 
          onType={setGeographicArea}
          objectValue={geographicArea} 
          inputName={"geographic_area_name"}
          placeholder={'Nombre de area greografica'}
          inputType={'text'}
          required={true}
          />
        <div className="mt-4">
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
            options={ arrayStrategyLevel.map((strategyLevel => strategyLevel.zone_type)) }
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Tipo de zona" />}
            />
        </div>
        {
          showGeographicAreaBelongsTo(geographicArea) &&
          <div className="mt-3">
            <Autocomplete
              disablePortal
              id="input-strategy"
              onInputChange={(event: any, newInputValue: string | null) => 
                { handleSearchGeographicAreaBelongsTo(event, newInputValue) }}
              onChange={(event: any, newValue: string | null | undefined) => 
                handleSelectGeographicAreaBelongsTo(event, newValue) }
              value={
                searchGeographicAreaBelongsTo
              }
              options={ arraySearchGeographicAreaBelongsTo.map((strategyLevel => `${strategyLevel.geographic_area_name} - ${strategyLevel.id_geographic_area}`)) }
              sx={{ width: 300 }}
              renderInput={(params) => <TextField {...params} label="Dentro de" />}
              />
          </div>
        }
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
            return <div key={strategyLevel.id_strategy} className="flex row justify-between">
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
      <div className="absolute  inset-x-0 top-0 mt-3 flex row justify-center items-center">
        <div className="z-10 bg-white mr-44 px-4 pt-2 rounded-lg">
          <div className="mt-1 "></div>
          <Searcher 
            placeholder="Buscar por area geografica o administrador"
            optionsToShow={searchGeographicAreas.map(element => {
              const option = {
                id: element.id_geographic_area !== undefined ? 
                  element.id_geographic_area : 0,
                data: `${element.geographic_area_name} | ${
                  element.zone_type===null ? "No tiene tipo de zona" : element.zone_type
                } - ${
                  (element.first_name === null && element.last_name === null) ? "No tiene administrador" : `${element.first_name} ${element.last_name}`
                } - ${
                  element.id_geographic_area
                }`
              }
              return option;
            })}
            onSelectOption={selectOptionMember}
            onType={onSearchTypeGeographicArea}
            />
        </div>
      </div>
    </div>
    <div className="absolute flex-col w-full h-full justify-center">
      <Tooltip title="Visualizar todas las areas geográficas">
        <button
          onClick={() => handleVisualizateAllGeographicArea()} 
          className={`z-10 absolute p-5 rounded-full hover:bg-orange-800 bottom-0 left-0 mb-44 ml-3 ${showAllGeographicAreas ? "bg-orange-800" : "bg-orange-600"}`} >
          <div className="text-white">
            <IoAppsSharp />
          </div>
        </button>
      </Tooltip>
    </div>
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
        onMouseMove={() => handleOnMouseMoveMap()}
        >
          {
            polygons.map((polygon) =>
            {
              return <PolygonF
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
                options={getPolygonColor(polygonColor, polygon.id_strategy)}
              ></PolygonF>
            } 
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