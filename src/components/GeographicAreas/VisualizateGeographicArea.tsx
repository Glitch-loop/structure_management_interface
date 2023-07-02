import { useEffect, useState } from 'react';
import { IStructure, IRequest, IGeographicArea, LatLng, IStrategy, IMember } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import { GoogleMap, PolygonF } from "@react-google-maps/api";
import { Dialog, DialogTitle, Tooltip, Switch } from "@mui/material"
import { FiEye } from "react-icons/fi"

interface NodeMember {
  data: IStructure;
  childs: NodeMember[];
}

interface IStrategyShow extends IStrategy {
  show?: boolean
}

class TreeNode {
  private root:NodeMember[];
  // private childs: NodeMember[];

  constructor() {
    this.root = [];
    // this.childs = []
  }


  /*
    The alghoritm doesn't care the cardinality level, if it detects a member that doesn't 
    a leader, that means that that members is going to be at the root of the three,
    otherwise, the leader is in the tree.

    It's important to empazhise that the "array" of members that are going to be added, 
    it must be organized ascendently take as reference point the cardinality level 
    (1, 2, 3,... n)
  */
  public addNode(newMember:IStructure):void {
    const newNode:NodeMember = {
      data: newMember,
      childs: []
    }
    
    if(newMember.id_leader === null) {
      //Mean that the user doesn't have leader
      /*
        Theorically the members with highest level 
        or member without leader
      */
      this.root.push(newNode)
    } else {
      // In the case of empty root
      this.addNodeRecursive(this.root, newNode);
    } 

  }

  private addNodeRecursive(currentNode: NodeMember[], child: NodeMember) {
    for(let i = 0; i < currentNode.length; i++) {
      if(currentNode[i].data.id_member === child.data.id_leader) {
        currentNode[i].childs.push(child);
      } else {
        if(currentNode[i].childs[0] !== undefined) {
          this.addNodeRecursive(currentNode[i].childs, child)
        }
      }
    }
  }

  public countStructure():number {
    let count = 0;
    for(let i = 0; i < this.root.length; i++) {
      const child:NodeMember = this.root[i];
      count += this.countRecursiveStructure(child.childs)
    }

    return count;
  }

  private countRecursiveStructure(currentNode: NodeMember[]):number {
    let count = 1;
    for(let i = 0; i < currentNode.length; i++) {
        const child:NodeMember = currentNode[i];
        count += this.countRecursiveStructure(child.childs)
    }
    return count;
  }


  /*
    If in the root is founded the member to count his followers, then, "memberFounded" variable is
    assigned true and go to recursivity... When the recursivity ends (and you get the number of
    followers that the member has), we avoid to iterate to the others "trees".
  */  
  public countMemberStructure(idMember: number|undefined):number {
    if(idMember !== undefined) {
      let count = 0;
      let memberFounded = false;
      for(let i = 0; i < this.root.length; i++) {
        
        const child:NodeMember = this.root[i];
        
        if(child.data.id_member === idMember) memberFounded = true;
  
        count += this.countMemberRecursiveStructure(child.childs, idMember, memberFounded)
  
        if (memberFounded) i = this.root.length + 1;
      }
  
      return count;
    } else return 0;
  }

  /*
  This is the recursive part of the alghoritm to count how many followers has a certain member.
  In this case if we already founded the member, then we count as if we were counted normaly the 
  tree (all the nodes below the target node are part of the sum...).

  Otherwise, if we don't still to find the node target, then we continue trying to find the node...

  In the case when were we already founded the node, we again avoid to follow iterating in the current level
  (we already have the tree that we want to found, so it isn't necessary to find in the tree).

  At the end we jut return the count that we has until now.
  */
  private countMemberRecursiveStructure(
    currentNode: NodeMember[], 
    idMember: number, 
    memberFounded: boolean):number {

      let count = 0;
      if(memberFounded) {
        count += this.countRecursiveStructure(currentNode)
      } else {
        for(let i = 0; i < currentNode.length; i++) {
          const child:NodeMember = currentNode[i];
          if(child.data.id_member === idMember) {
            memberFounded = true;
            count += this.countRecursiveStructure(child.childs)
          } else {
            count += this.countMemberRecursiveStructure(child.childs, idMember, memberFounded)
          }
          if (memberFounded) i = this.root.length + 1;
      }
    }
    return count;
  }

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

function findManagerGeographicArea(members:IMember[], geographicArea:IGeographicArea|undefined):string {
  const manager:IMember|undefined = members.find(member => member.id_member === geographicArea?.id_member)

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
      <DialogTitle>Area geografica</DialogTitle>   
      <div className="p-5 pb-10 flex flex-col justify-center">
        <h6>
          Nombre de area geografica: {geographicArea?.geographic_area_name}
        </h6>
        <h6>
          Tipo de area: {findTypeArea(arrayStrategyLevel, geographicArea)}
        </h6>
        <h6>
          Persona quien lo administra: {findManagerGeographicArea(members, geographicArea)}
        </h6>
        <h6>
          Numero de personas en la estructura: {treeMembers?.countMemberStructure(geographicArea?.id_member)}
        </h6>
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
  
            ></PolygonF>
          }
          )
        }
    </GoogleMap>
  </>)
}



export default VisualizateGeographicArea;