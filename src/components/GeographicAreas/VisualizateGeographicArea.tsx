import { useEffect, useState } from 'react';
import { IStructure, IRequest, IGeographicArea, LatLng, IStrategy, IMember, IColor } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import { GoogleMap, PolygonF } from "@react-google-maps/api";
import { Dialog, DialogTitle, Tooltip, Switch } from "@mui/material"
import { FiEye } from "react-icons/fi"
import { randomNumber } from "../../utils/utils"
import TreeNode from '../../alghoritms/TreeNode';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { IoAppsSharp } from "react-icons/io5";
import Searcher from "../UIcomponents/Searcher";


interface IStrategyShow extends IStrategy {
  show?: boolean
}

function getColorForPolygon(): any {
  const colorCombination:IColor = {
    target: 0,
    spectrum1: randomNumber(50),
    spectrum2: randomNumber(50),
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

function findTypeArea(arrayStrategyLevel:IStrategy[], geographicArea:IGeographicArea|undefined):string {
  const strategyLevel:IStrategy|undefined = arrayStrategyLevel.find(strategyLevel => strategyLevel.id_strategy === geographicArea?.id_strategy)

  if(strategyLevel !== undefined){
    return strategyLevel.zone_type
  } else return '';
}

function findManagerGeographicArea(members:IStructure[], geographicArea:IGeographicArea|undefined):string {
  const manager:IStructure|undefined = members.find(member => member.id_member === geographicArea?.id_member)

  if(manager !== undefined){
    return `${manager.first_name} ${manager.last_name}`
  } else return '';
}

const VisualizateGeographicArea = () => {
  const [centerMap, setCenterMap] = useState<LatLng>({lat:20.64125680004875, lng: -105.22139813464167});

  const [members, setMembers] = useState<IStructure[]>([])
  const [treeMembers, setTreeMembers] = useState<TreeNode|undefined>(undefined)

  const [polygons, setPolygons] = useState<IGeographicArea[]>([]);
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategyShow[]>([]);

  const [showVisualizationForm, setShowVisualizationForm] = useState<boolean>(false);
  const [showAnalysisGeographicArea, setShowAnalysisGeographicArea] = useState<boolean>(false);

  const [geographicArea, setGeographicArea] = useState<IGeographicArea|undefined>()

  const [polygonColor, setPolygonColor] = useState<any[]>([]);

  //State for geographic area visualization
  const [showAllGeographicAreas, setShowAllGeographicAreas] = useState<boolean>(false);

  //States for searcher
  const [searchGeographicAreas, setSearchGeographicAreas] = useState<IStructure[]>([]);
  const [storeResponseSearchGeographicAreas, setStoreResponseSearchGeographicAreas] = useState<IStructure[]>([]);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    getAllMembers()
    getStrategy()
  }, [])


  //Calls API
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

  const getAllMembers = async () => { 
    const response:IRequest<IStructure[]> = await requester({
      method: 'GET',
      url: `/members`
    })
    
    console.log(response.data)
    if(response.data !== undefined) {
      const members = response.data;
      const tree = new TreeNode()

      for(let i = 0; i < members.length; i++) {
        tree.addNode(members[i]);
      }
      setTreeMembers(tree)
      setMembers(members)
    }
  }

  const getStrategy = async() => {
    const response:IRequest<IStrategy[]> = await requester({
      url: `/strategyLevels`,
      method: 'GET'
    })
    if(response.data !== undefined) {
      const strategyLevels:IStrategyShow[] = response.data.filter(level => level.zone_type !== "")

      const definePolygonColor:any[] = [];
      strategyLevels.forEach(level => {
        definePolygonColor.push({
          id_strategy: level.id_strategy,
          options: getColorForPolygon()
        })
      }) 
      
      setPolygonColor(definePolygonColor);
      

      setArrayStrategyLevel(strategyLevels.map(strategyLevel => {
        strategyLevel.show = true;
        return strategyLevel
      }))
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


  //Handlers
  const handleShowTypeArea = ():void => {
    setShowVisualizationForm(true)
  }

  const handleCloseShowTypeArea = ():void => {
    setShowVisualizationForm(false)
  }

  const handleSwitchShowZoneType = (e: any, strategyLevelSwitch: IStrategyShow):void => {
    const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy === strategyLevelSwitch.id_strategy);

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

  const handleCloseShowAnalysisGeographicArea = ():void => {
    setShowAnalysisGeographicArea(false)
  }

  const handleOpenShowAnalysisGeographicArea = (e:any, polygon:IGeographicArea):void => {
    setShowAnalysisGeographicArea(true);
    setGeographicArea(polygon);

  }

  //Handler to visualizate geographic areas
  const handleVisualizateAllGeographicArea = async ():Promise<void> => {
    const dataResponse:IGeographicArea[] = await getAllPolygons();
    setPolygons(dataResponse);
    setShowAllGeographicAreas(true);
  }
  
  //Handlers for searcher
  const selectOptionMember = async (idGeographicArea: number) => {
    const findGeographicArea:undefined|IStructure = storeResponseSearchGeographicAreas
      .find(geographicArea => geographicArea.id_geographic_area === idGeographicArea);

    //Ask the geographic area
    if(findGeographicArea !== undefined) 
      if(findGeographicArea.id_geographic_area !== undefined) {
        const dataResponse:IGeographicArea[] = 
          await getGeographicAreasInside(findGeographicArea.id_geographic_area);
        console.log(dataResponse)

        setPolygons(dataResponse);
        setShowAllGeographicAreas(false);
      }


    setSearchGeographicAreas([]);
    setStoreResponseSearchGeographicAreas([]);
  }

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

  return (<>
    <Dialog onClose={handleCloseShowTypeArea} open={showVisualizationForm}>
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
    <Dialog onClose={handleCloseShowAnalysisGeographicArea} open={showAnalysisGeographicArea}>
      <div className='p-5'>
        <p className='text-xl font-bold text-center mt-2'>Area geografica</p>
        <div className="p-5 pb-10 flex flex-col justify-center text-lg">
        <p className='text-center  mt-2'>
            Miembros de la estructura en el area: 
            <span className='italic ml-2 font-bold'>
              {treeMembers?.countMemberStructure(geographicArea?.id_member)}
            </span>
          </p>
          <p className='mt-2'>
            Persona quien lo administra: 
            <span className='italic ml-2'>
              { findManagerGeographicArea(members, geographicArea) }
            </span>
          </p>
          <p className='mt-2'>
            Nombre de area geografica: 
            <span className='italic ml-2'>
              {geographicArea?.geographic_area_name}
            </span>
          </p>
          <p className='mt-2'>
            Tipo de area: 
            <span className='italic ml-2'>
              {findTypeArea(arrayStrategyLevel, geographicArea)}
            </span>
          </p>
        </div>
      </div>
    </Dialog>
    <div className="absolute flex-col w-full h-full justify-center">
      <div className="absolute  inset-x-0 top-0 mt-3 flex row justify-center items-center">
        <div className="z-10 bg-white mr-44 px-4 pt-2 rounded-lg">
          <div className="mt-1 "></div>
          <Searcher 
            placeholder="Buscar por nombre de area geografica o administrador"
            optionsToShow={searchGeographicAreas.map(element => {
              const option = {
                id: element.id_geographic_area !== undefined ? 
                  element.id_geographic_area : 0,
                data: `${element.geographic_area_name} | ${
                  element.zone_type===null ? "No tiene tipo de zona" : element.zone_type
                } - ${
                  (element.first_name === null && element.last_name === null) ? "No tiene administrador" : `${element.first_name} ${element.last_name}`
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
          className={`z-10 absolute p-5 rounded-full hover:bg-orange-800 bottom-0 left-0 mb-28 ml-3 ${showAllGeographicAreas ? "bg-orange-800" : "bg-orange-600"}`} >
          <div className="text-white">
            <IoAppsSharp />
          </div>
        </button>
      </Tooltip>
    </div>
      <div className="absolute flex-col w-full h-full justify-center">
        <Tooltip title="Crear nueva area">
          <button
            onClick={() => handleShowTypeArea()} 
            className={`z-10 absolute p-5 rounded-full hover:bg-lime-800 bottom-0 left-0 mb-12 ml-3 ${showVisualizationForm ? "bg-lime-800" : "bg-lime-600"}`} >
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
        >
        {
          polygons[0]!==undefined &&
          polygons.map((polygon) => {
            return <PolygonF
              key={polygon.id_geographic_area}
              visible={polygonVisible(arrayStrategyLevel, polygon)}
              // onClick={(e: any) => {handleDataClickPolygon(e, polygon)}} 
              onDblClick={(e: any) => {
                handleOpenShowAnalysisGeographicArea(e, polygon)
              }}
              path={polygon.coordinates}
              options={getPolygonColor(polygonColor, polygon.id_strategy)}

            ></PolygonF>
          }
          )
        }
    </GoogleMap>
  </>)
}



export default VisualizateGeographicArea;