import { Options, Edge, Node } from "vis-network";
import { useEffect, useState } from "react";
import { DataSet } from "vis-data/esnext";
import requester from "../../helpers/Requester";
import { IRequest, IStructure } from "../../interfaces/interfaces";
import Graphos from "./Graphos";
import Searcher from "../UIcomponents/Searcher";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Tooltip } from "@mui/material";
import { IoAppsSharp } from "react-icons/io5";
import Forbbiden from "../Authorization/Forbbiden";

interface IColor {
  target: number;
  spectrum1: number;
  spectrum2: number;
  spectrum3: number;
  opactity: number;
}

const options: Options = {
  physics: {
    enabled: false
  },
  groups: {
    market: {
      shape: "triangleDown"
    },
    struct: {
      shape: "hexagon"
    }
  },
  interaction: {
    selectable: false,
    selectConnectedEdges: false,
  },
  edges: {
    smooth: {
      enabled: true,
      type: "diagonalCross",
      roundness: 0.5
    },
    arrows: {
      to: true
    }
  },
  nodes: {
    shape: "dot",
    size: 16,
  },
  layout: {
    hierarchical: {
      enabled: true,
        levelSeparation: 150,
      nodeSpacing: 200,
      treeSpacing: 200,
      // blockShifting: true,
    }
  }
};

const getHandlerCardinalityLevelNull = (members: IStructure[]):IStructure[] => { 
  //Get grater cardinality level
  let graterCardinalityLevel = 0;
  members.forEach(member => {
  if(member.cardinality_level !== undefined &&  
    member.cardinality_level !== null)
      if(member.cardinality_level > graterCardinalityLevel)
        graterCardinalityLevel = member.cardinality_level;
  })
  
  graterCardinalityLevel++;

 //Handle those members with "null" cardinality level
 const memberWithoutNull:IStructure[] = members.map(member => {
  if(member.cardinality_level === undefined || member.cardinality_level === null)
    member.cardinality_level = graterCardinalityLevel;
  return member
 })

 return memberWithoutNull;
}

const randomNumber = (maximumNumber:number):number => {
  return Math.floor((Math.random() * maximumNumber) + 1)
}

const generateColors = (members: IStructure[]):IColor[] => {
  const rangeColors:IColor[] = [];

  members.forEach(member => {
    if(member.cardinality_level !== undefined) {
      //If it is 'undefined' that means that there is a new level to add
      if(rangeColors.find(rangeColor => rangeColor.target === member.cardinality_level ) === undefined) {
        const newLevel:IColor = {
          target: member.cardinality_level,
          spectrum1: randomNumber(254),
          spectrum2: randomNumber(254),
          spectrum3: randomNumber(254),
          opactity: 1
        };        
        rangeColors.push(newLevel)
      }
    }
  })

  return rangeColors;
}

const StructureVisualization = () => {
  //Privileges state
  const [viewAllStructurePrivilege, setViewAllStructurePrivilege] = useState<boolean>(false);
  const [searchIndividualStruaturePrivilege, setSearchIndividualStruaturePrivilege] = useState<boolean>(false);
  /*
    We can graph a "nodes graph" just using Node and Edges interfaces
    but use "DataSet" makes able to us to establish options for
    enhance the behaviour of our nodes. 
  */
  //Operational states
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dataSetNodes, setDataSetNodes] = useState<any>(undefined);
  const [dataSetEdges, setDataSetEdges] = useState<any>(undefined);

  const [searchMembers, setSearchMembers] = useState<IStructure[]>([]);
  const [storeResponseSearchMember, setStoreResponseSearchMember] = useState<IStructure[]>([]);

  const [showAllTheStructure, setShowAllTheStructure] = useState<boolean>(false);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    //Get search individual structure privilege
    requester({url: '/privileges/user/[24]', method: "GET"})
    .then(response => {
      setSearchIndividualStruaturePrivilege(response.data.privilege);
    });
    //Get view all structure privilege
    requester({url: '/privileges/user/[25]', method: "GET"})
    .then(response => {
      setViewAllStructurePrivilege(response.data.privilege);
    });
  } ,[])

  //Calls to API
  //The dara is order ascedently taken cardinality level as factor
  //Ej: 1, 2, 3, 4
  const getStructure = async () => {
    const actualStructure:IRequest<IStructure[]>  = await requester({
      url: '/data/structure'
    })

    if(actualStructure.data !== undefined) {
      setDataInNode(actualStructure.data)      
    }
  }

  const getMemberStructure = async (id_leader:number) => {
    const actualStructure:IRequest<IStructure[]>  = await requester({
      url: `/data/structure/strategyLevel/${id_leader}`
    })

    if(actualStructure.data !== undefined) {
      setDataInNode(actualStructure.data);
    }
  }

  const searchMember = async(string_to_search: string):Promise<IStructure[]> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/members/search/${string_to_search}`,
        method: 'GET'
      })

      if(response.code === 200) 
        if(response.data !== undefined) 
          return response.data;
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar hacer la busqueda, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }



  //Handle on select member
  //Handlers
  const setDataInNode = (data:IStructure[]):void => {
    const members:IStructure[] = getHandlerCardinalityLevelNull(data);
    const nodesColor:IColor[] = generateColors(members);

    const currentNodes: Node[] = [];
    const currentEdges: Edge[] = [];
    
    members.forEach(member => {
      //Find the color of the node according to their heriarchical level
      const index:number = nodesColor.findIndex(nodeColor => nodeColor.target === member.cardinality_level);

      const color = `rgb(${nodesColor[index].spectrum1}, ${nodesColor[index].spectrum2}, ${nodesColor[index].spectrum2}, ${nodesColor[index].opactity})`;
      const border = `rgb(${nodesColor[index].spectrum1}, ${nodesColor[index].spectrum2}, ${nodesColor[index].spectrum2}, ${nodesColor[index].opactity+0.5})`;

      //Set the nodes
      currentNodes.push({
        id: member.id_member, 
        label: `${member.first_name} ${member.last_name} \n${
          member.role===null ? "Sin nivel estrategico":member.role
        }`,
        level: member.cardinality_level,
        color: {
          background: color,
          border: "black"
        },
        borderWidth: 1
      })

      //Set the edges
      if( member.id_leader !== undefined &&  member.id_leader !== null) {
        //This if is to avoid errors in case that the member doesn't have a leader
        currentEdges.push({ 
          from: member.id_member, 
          to: member.id_leader,
          color: 'black'
        })
      }
    })

    //Set the node to display
    setNodes(currentNodes)
    setEdges(currentEdges)

    //Create DataSet
    const dataSetCurrentNodes = new DataSet(currentNodes);
    const dataSetCurrentEdges = new DataSet(currentEdges);
  
    setDataSetNodes(dataSetCurrentNodes);
    setDataSetEdges(dataSetCurrentEdges);
  
  }

  const onSearchTypeMember = async(stringToSearch: string) => {
    if(stringToSearch === "") {
      setStoreResponseSearchMember([]);
      setSearchMembers([]);
    } else {
      if(storeResponseSearchMember[0] !== undefined) {
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
      
        const personsToShow:IStructure[] = storeResponseSearchMember.filter(person => {
            const name = `${person.first_name} ${person.last_name}`;
            const cell_phone_number = `${person.cell_phone_number}`;
            const ine = `${person.ine}`;
            if(
                re.test(name.toLocaleLowerCase()) === true ||
                re.test(cell_phone_number) === true ||
                re.test(ine)
              ) 
              return person;
          })
        
        if(personsToShow !== undefined) setSearchMembers(personsToShow);
        else setSearchMembers([]);  
      } else {
        const responseData:IStructure[] = await searchMember(stringToSearch);
        setStoreResponseSearchMember(responseData);
        setSearchMembers(responseData);
      }
    }
  }

  const selectOptionMember = async (idLeader: number) => {
    setShowAllTheStructure(false);
    const findDataLeader:undefined|IStructure = storeResponseSearchMember
      .find(member => member.id_member === idLeader);
    
    if(findDataLeader !== undefined)
      await getMemberStructure(findDataLeader?.id_member);


    setSearchMembers([]);
    setStoreResponseSearchMember([]);
  }

  const handleShowAllStructure = async():Promise<void> => {
    setShowAllTheStructure(true)
    await getStructure();
  }

  return(
    (viewAllStructurePrivilege === true || searchIndividualStruaturePrivilege === true) ?
    <>
      { searchIndividualStruaturePrivilege === true && 
        <div className="flex items-center justify-center">
          <div className="p-2 rounded-lg bg-slate-200 ">
            <Searcher 
              placeholder={"Buscar por nombre, numero ó INE"}
              optionsToShow={searchMembers.map(element => {
                const option = {
                  id: element.id_member,
                  data: `${element.first_name} ${element.last_name} / ${element.cell_phone_number} / ${element.ine}`
                }
                return option;
              })}
              onSelectOption={selectOptionMember}
              onType={onSearchTypeMember}
            />
          </div>
        </div>
      }
      { viewAllStructurePrivilege === true &&
        <div className="absolute flex-col w-full h-full justify-center">
          <Tooltip title="Crear nueva area">
            <button
              onClick={ () => handleShowAllStructure() } 
              className={`z-10 absolute p-5 rounded-full hover:bg-lime-800 bottom-0 left-0 mb-28 ml-3 ${showAllTheStructure ? "bg-lime-800" : "bg-lime-600"}`} >
              <div className="text-white">
                <IoAppsSharp />
              </div>
            </button>
          </Tooltip>
        </div>
      }
      {(nodes[0]!==undefined && edges[0]!==undefined) && 
        <Graphos 
          nodes={nodes}
          edges={edges}
          dataSetNodes={dataSetNodes}
          dataSetEdges={dataSetEdges}
          options={options}
        />
      }
    </> :
    <div className="h-full flex flex-row justify-center items-center">
      <Forbbiden />
    </div>
    
  )
}

export default StructureVisualization;