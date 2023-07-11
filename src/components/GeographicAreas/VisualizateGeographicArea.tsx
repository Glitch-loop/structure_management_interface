import { useEffect, useState } from 'react';
import { IStructure, IRequest, IGeographicArea, LatLng, IStrategy, IMember, IColor } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import { GoogleMap, PolygonF } from "@react-google-maps/api";
import { Dialog, DialogTitle, Tooltip, Switch } from "@mui/material"
import { FiEye } from "react-icons/fi"
import { randomNumber } from "../../utils/utils"
import TreeNode from '../../alghoritms/TreeNode';


interface IStrategyShow extends IStrategy {
  show?: boolean
}

function getColorForPolygon(): any {
  const colorCombination:IColor = {
    target: 0,
    spectrum1: randomNumber(254),
    spectrum2: randomNumber(254),
    spectrum3: randomNumber(254),
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
  useEffect(() => {
    getAllMembers()
    getAllPolygons()
    getStrategy()
  }, [])

  const [centerMap, setCenterMap] = useState<LatLng>({lat:20.64125680004875, lng: -105.22139813464167});

  const [members, setMembers] = useState<IStructure[]>([])
  const [treeMembers, setTreeMembers] = useState<TreeNode|undefined>(undefined)

  const [polygons, setPolygons] = useState<IGeographicArea[]>([]);
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategyShow[]>([]);

  const [showVisualizationForm, setShowVisualizationForm] = useState<boolean>(false);
  const [showAnalysisGeographicArea, setShowAnalysisGeographicArea] = useState<boolean>(false);

  const [geographicArea, setGeographicArea] = useState<IGeographicArea|undefined>()
    //Use effect functions
    const getAllPolygons = async () => { 
      const response:IRequest<IGeographicArea[]> = await requester({
        url: `/geographicAreas`
      })
  
      if(response.data !== undefined) {
        const polygonsDB = response.data;
        setPolygons(polygonsDB)
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

  const getStrategy = async() => {
    const response:IRequest<IStrategy[]> = await requester({
      url: `/strategyLevels`,
      method: 'GET'
    })
    if(response.data !== undefined) {
      const strategyLevels:IStrategyShow[] = response.data.filter(level => level.zone_type !== "")

      
      setArrayStrategyLevel(strategyLevels.map(strategyLevel => {
        strategyLevel.show = true;
        return strategyLevel
      }))
    }
  }

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
              // options={getColorForPolygon()}
  
            ></PolygonF>
          }
          )
        }
    </GoogleMap>
  </>)
}



export default VisualizateGeographicArea;