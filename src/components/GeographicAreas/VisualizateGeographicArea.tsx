import { useEffect, useState } from 'react';
import { IStructure, IRequest, IGeographicArea, LatLng, IStrategy, ISectional } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import { GoogleMap, PolygonF } from "@react-google-maps/api";
import { Dialog, DialogTitle, Tooltip, Switch } from "@mui/material"
import { FiEye } from "react-icons/fi"
import { getPercentage } from "../../utils/utils"
import TreeNode from '../../alghoritms/TreeNode';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { IoAppsSharp } from "react-icons/io5";
import Forbbiden from '../Authorization/Forbbiden';
import SearchAllTypesGeographicAreas from '../Searchers/SearchAllTypesGeographicAreas';
// Import constants and functions
import { 
  initialSectional,
  getColorForPolygon,
  polygonVisible,
  getPolygonColor,
  getColorForPercentage,
  getPolygonConfig
 } from './ManageGeographicAreasMapRenderUtils';

interface IStrategyShow extends IStrategy {
  show?: boolean
}

function findTypeArea(arrayStrategyLevel:IStrategy[], geographicArea:IGeographicArea|undefined):string {
  const strategyLevel:IStrategy|undefined = arrayStrategyLevel.find(strategyLevel => strategyLevel.id_strategy === geographicArea?.id_strategy)

  if(strategyLevel !== undefined){
    return strategyLevel.zone_type
  } else return '';
}

function findManagerGeographicArea(members:IStructure[], geographicArea:IGeographicArea|undefined):string {
  const manager:IStructure|undefined = members.find(member => member.id_member === geographicArea?.id_member)

  if(manager !== undefined && manager !== null){
    return `${manager.first_name} ${manager.last_name}`
  } else return 'Sin asignar lider';
}

const VisualizateGeographicArea = () => {
  //Privilege states
  const [searchGeographicAreaPrivilege, setSearchGeographicAreaPrivilege] = useState<boolean>(false);
  const [viewAllGeographicAreaPrivilege, setViewAllGeographicAreaPrivilege] = useState<boolean>(false);
  const [searchSectionalAreaPrivilege, setSearchSectionalAreaPrivilege] = useState<boolean>(false);
  const [viewAllSectionalAreasPrivilege, setViewAllSectionalAreaPrivilege] = useState<boolean>(false);

  //Operational states
  const [centerMap, setCenterMap] = useState<LatLng>({lat:20.64125680004875, lng: -105.22139813464167});

  const [members, setMembers] = useState<IStructure[]>([])
  const [treeMembers, setTreeMembers] = useState<TreeNode|undefined>(undefined)

  const [polygons, setPolygons] = useState<IGeographicArea[]>([]);
  const [sectionalPolygons, setSectionalPolygons] = useState<ISectional[]>([]);

  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategyShow[]>([]);

  const [showVisualizationForm, setShowVisualizationForm] = useState<boolean>(false);
  const [showAnalysisGeographicArea, setShowAnalysisGeographicArea] = useState<boolean>(false);
  const [showAnalysisSectionalArea, setShowAnalysisSectionalArea] = useState<boolean>(false);

  const [geographicArea, setGeographicArea] = useState<IGeographicArea|undefined>()
  const [sectionalArea, setSectionalArea] = useState<ISectional|undefined>()

  const [polygonColor, setPolygonColor] = useState<any[]>([]);

  //State for geographic area visualization
  const [showAllGeographicAreas, setShowAllGeographicAreas] = useState<boolean>(false);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();

  useEffect(() => {
    //Get search geographic area privilege
    requester({url: '/privileges/user/[29]', method: "GET"})
    .then(response => {
      setSearchGeographicAreaPrivilege(response.data.privilege);
    });
    
    //Get view all geographic areas privilege
    requester({url: '/privileges/user/[30]', method: "GET"})
    .then(response => {
      setViewAllGeographicAreaPrivilege(response.data.privilege);
    });

    //Get search sectional areas privilege
    requester({url: '/privileges/user/[35]', method: "GET"})
    .then(response => {
      setSearchSectionalAreaPrivilege(response.data.privilege);
    });

    //Get view all sectional areas privilege
    requester({url: '/privileges/user/[36]', method: "GET"})
    .then(response => {
      setViewAllSectionalAreaPrivilege(response.data.privilege);
    });


    getAllMembers();

    getStrategy()
    .then((dataStrategyLevels:IStrategy[]) => {
      /*
        Convert from IStrategy to IStrategyShow, this is for order to the map
        to show just the geographic areas type that area active, otherwise,
        the geographic areas won't be rendered.
      */
      const strategyLevels:IStrategyShow[] = dataStrategyLevels.filter(level => level.zone_type !== "");

      //State exclusive for select a zone type in geographic areas according to the strategy
      strategyLevels.push(
        {
          id_strategy: -1,
          zone_type: "Seccionales",
          role: "",
          cardinality_level: -1,
          show: false
        }
      )

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
          alertType: EAlert.warning, 
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

  const getSectionalByID = async(idSectional: number):Promise<ISectional[]> => {
    try {
      const response: IRequest<ISectional[]> = await requester({
        url: `/sectionals/${idSectional}`,
        method: 'GET',
      })
      if(response.code === 200) {
        if(response.data !== undefined) return response.data;
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las areas geograficas, intente mas tarde"}})); 
      }
      return [ initialSectional ];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
      return [initialSectional];
    }
  }

  const getAllSectionals = async():Promise<ISectional[]> => {
    try {
      const response:IRequest<ISectional[]> = await requester({
        url: `/sectionals/areas/coordinates/`})
      if(response.code === 200)
        if(response.data !== undefined) 
          return response.data;

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar obtener los seccionales, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
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

  const handleCloseShowAnalysisSectionalArea = ():void => {
    setShowAnalysisSectionalArea(false)
  }

  const handleOpenShowAnalysisGeographicArea = (e:any, polygon:IGeographicArea):void => {
    setShowAnalysisGeographicArea(true);
    setGeographicArea(polygon);
  }

  const handleOpenShowAnalysisSectionalArea = (e:any, polygon:ISectional):void => {
    setShowAnalysisSectionalArea(true);
    setSectionalArea(polygon);

  }

  //Handler to visualizate geographic areas (all types)
  const handleVisualizateAllGeographicArea = async ():Promise<void> => {
    // Get geographic areas according to the strategy
    if(viewAllGeographicAreaPrivilege === true) {
      const dataResponse:IGeographicArea[] = await getAllPolygons();
      setPolygons(dataResponse);
    }

    // Get sectionals 
    if(viewAllSectionalAreasPrivilege === true) {
      const sectionalDataResponse:ISectional[] = await getAllSectionals();
      setSectionalPolygons(sectionalDataResponse);
    }

    setShowAllGeographicAreas(true);
  }
  
  //Handlers for searcher
  const selectOption = async (geographicArea: IStructure&ISectional|undefined) => {
    if(geographicArea !== undefined)  {
      
      if(geographicArea.id_sectional === undefined) {
        //User is try to find a geographic area of the strategy
        //Find geographic area coordinates
        if(geographicArea.id_geographic_area !== undefined) {
          const dataResponse:IGeographicArea[] = 
            await getGeographicAreasInside(geographicArea.id_geographic_area);
          setPolygons(dataResponse);
          setSectionalPolygons([]);
          setShowAllGeographicAreas(false);
        }
      } else {
        //User is try to find a sectional
        const dataResponse:ISectional[] = await getSectionalByID(geographicArea.id_sectional);

        setPolygons([]);
        setSectionalPolygons(dataResponse);
        setShowAllGeographicAreas(false);
      }
    }
  }

  return (<>
    <Dialog onClose={handleCloseShowTypeArea} open={showVisualizationForm}>
      <DialogTitle>Visualizar areas</DialogTitle>   
      <div className="p-5 flex flex-col justify-center">
        {
          arrayStrategyLevel.map(strategyLevel => {
            if(strategyLevel.id_strategy !== -1) {
              return <div key={strategyLevel.id_strategy} className="flex row justify-between">
                <p className="text-lg">{strategyLevel.zone_type}</p>
                <Switch 
                  checked={strategyLevel.show}
                  onChange={(e:any) => handleSwitchShowZoneType(e, strategyLevel)}
                />
              </div>
            } else {
              return <div key={strategyLevel.id_strategy} className="flex flex-col">
                
                <DialogTitle>Seccionales</DialogTitle>   
                <div className='flex flex-row justify-between'>
                  <p className="text-lg">{strategyLevel.zone_type}</p>
                  <Switch 
                    checked={strategyLevel.show}
                    onChange={(e:any) => handleSwitchShowZoneType(e, strategyLevel)}
                  />
                </div>    
              </div>
            }
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
          <p>ID del area geográfica: 
              <span className="ml-2 italic font-bold">
                {geographicArea?.id_geographic_area}
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
    <Dialog onClose={handleCloseShowAnalysisSectionalArea} open={showAnalysisSectionalArea}>
      <div className='p-5'>
        <p className='text-xl font-bold text-center mt-2'>Seccional</p>
        <div className="p-5 pb-10 flex flex-col justify-center text-lg">
          <p className='mt-2'>
            Nombre del seccional: 
            <span className='italic ml-2'>
              {sectionalArea?.sectional_name}
            </span>
          </p>
          <p className='text-center  mt-2'>
            Objetivo de miembros a tener: 
            <span className='italic ml-2 font-bold'>
              {sectionalArea?.target_members}
            </span>
          </p>
          <p className='text-center  mt-2'>
            Miembros actuales: 
            <span className='italic ml-2 font-bold'>
              {sectionalArea?.current_members}
            </span>
          </p>
          <p className='text-center  mt-2'>
            Porcentaje para llegar a la meta: 
            <span className='italic ml-2 font-bold'>
              {getPercentage(sectionalArea?.target_members, sectionalArea?.current_members)}%
            </span>
          </p>
          <p className='mt-5'>
            Direccion de casilla: 
            <span className='italic ml-2'>
              {
                sectionalArea?.sectional_address === null ? 
                "Aun no se ha registrado la dirección de la casilla" : 
                sectionalArea?.sectional_address
              }
            </span>
          </p>
        </div>
      </div>
    </Dialog>
    { (searchGeographicAreaPrivilege === true 
    || viewAllGeographicAreaPrivilege === true
    || searchSectionalAreaPrivilege === true
    || viewAllSectionalAreasPrivilege === true) ? 
      <>
        { (searchGeographicAreaPrivilege === true
        || searchSectionalAreaPrivilege === true) &&
          <div className="absolute flex-col w-full h-full justify-center">
            <div className="absolute  inset-x-0 top-0 mt-3 flex row justify-center items-center">
              <div className="z-10 bg-white mr-44 p-4 rounded-lg">
                  <SearchAllTypesGeographicAreas onSelectItem={selectOption}/>
              </div>
            </div>
          </div>
        }
        { (viewAllGeographicAreaPrivilege === true
        || viewAllSectionalAreasPrivilege === true) &&
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
        }
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
                onDblClick={(e: any) => {
                  handleOpenShowAnalysisGeographicArea(e, polygon)
                }}
                path={polygon.coordinates}
                options={ getPolygonColor(polygonColor, polygon.id_strategy) }

              ></PolygonF>
            }
            )
          }
          {
            sectionalPolygons[0] !== undefined &&
            sectionalPolygons.map((polygon) => {
              return <PolygonF
                key={polygon.id_sectional}
                visible={polygonVisible(arrayStrategyLevel, polygon)}
                onDblClick={(e: any) => {
                  handleOpenShowAnalysisSectionalArea(e, polygon)
                }}
                path={polygon.coordinates}
                options={ 
                  getPolygonConfig(
                    getColorForPercentage(
                      getPercentage(polygon.target_members, polygon.current_members), 100
                      ))}
              ></PolygonF>
            }
            )
          }
        </GoogleMap>
      </> : 
      <div className='h-full flex flex-row justify-center items-center'>
        <Forbbiden />
      </div>
    }

  </>)
}



export default VisualizateGeographicArea;