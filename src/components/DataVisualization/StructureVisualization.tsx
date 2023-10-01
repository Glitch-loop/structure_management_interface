import { Options, Edge, Node } from "vis-network";
import { useEffect, useState } from "react";
import { DataSet } from "vis-data/esnext";
import requester from "../../helpers/Requester";
import { IRequest, IStructure, IStrategy } from "../../interfaces/interfaces";
import Graphos from "./Graphos";
import Searcher from "../UIcomponents/Searcher";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Tooltip, Dialog } from "@mui/material";
import { IoAppsSharp } from "react-icons/io5";
import { RiFileExcel2Fill } from "react-icons/ri";
import Button from "../UIcomponents/Button";
import ExcelJS from 'exceljs';
import Forbbiden from "../Authorization/Forbbiden";
import StrategyAutocomplete from "../Autocompletes/StrategyAutocomplete";

// interfaces especialized
interface IColor {
  target: number;
  spectrum1: number;
  spectrum2: number;
  spectrum3: number;
  opactity: number;
}

interface IStructureSortedStrategyLevel {
  data: IStructure,
  childs: IStructureSortedStrategyLevel[]
}

interface IStyleExcelStructure extends IStrategy {
  colPosition?: number,
  fontSize?: number

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
    size: 30,
  },
  layout: {
    hierarchical: {
      enabled: true,
      levelSeparation: 500,
      nodeSpacing: 250,
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

// const traverseTreeRecu = (tree: IStructureSortedStrategyLevel[]):void => {

// }

const traverseTree = (
      node: IStructureSortedStrategyLevel[], 
      simplifiedLevelStructure: any[]):void => {
  for(let i = 0; i < node.length; i++) {
    simplifiedLevelStructure.push(node[i])
    if(node[i].childs.length > 0) {
      traverseTree(node[i].childs, simplifiedLevelStructure)
    }
  }  
}

const StructureVisualization = () => {
  //Privileges state
  const [viewAllStructurePrivilege, setViewAllStructurePrivilege] = useState<boolean>(false);
  const [searchIndividualStructurePrivilege, setSearchIndividualStruaturePrivilege] = useState<boolean>(false);
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
  const [leaderIndividualStructure, setLeaderIndividualStructure] = useState<number>(0);
  const [storeResponseSearchMember, setStoreResponseSearchMember] = useState<IStructure[]>([]);
  
  // Excel report states
  const [consultIndividualStructure, setConsultIndividualStructure] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [limitStrategyLevelShow, setLimitStrategyLevelShow] = useState<IStrategy|undefined>(undefined);

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
  //The data is order ascedently taken cardinality level as factor
  /*
    The sense of the image is given by the cardinality level (and it depends in the 
    current strategy that the manager created).
    
    Always the highes level is 1 and the lowest is n, so the order is ascendelty:
    1, 2, 3, 4... n
    
  */ 
  const getStructure = async ():Promise<void> => {
    try {
      const actualStructure:IRequest<IStructure[]>  = await requester({
        url: '/data/structure'
      })
      
      if(actualStructure.data !== undefined) {
        setDataInNode(actualStructure.data)
      }
      
    } catch (error) {
      setDataInNode([])
    }
  }

  const getMemberStructure = async (id_leader:number):Promise<void> => {
    try {
      const actualStructure:IRequest<IStructure[]>  = await requester({
        url: `/data/structure/strategyLevel/${id_leader}`
      })
  
      if(actualStructure.data !== undefined) {
        setDataInNode(actualStructure.data);
      }
    } catch (error) {
      setDataInNode([]);
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

  const getIndividualStructureSortedByLevel = async (id_leader:number):Promise<IStructureSortedStrategyLevel[]> => {
    try {
      const individualStructure:IRequest<IStructureSortedStrategyLevel[]>  = await requester({
        url: `/data/structure/strategyLevel/sorted/${id_leader}`
      })
  
      if(individualStructure.data !== undefined) {
        return individualStructure.data
      } else {
        return [];
      }
    } catch (error) {
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

  /*
    This handlers is to handle when the user type in the searcher.
    If in the state (where the opcions are stored), is empty or didn't match by
    what the user is searching, then it makes a request to the backend.
    With the current input
  */
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

  /*
    This function is to handle when the user select the option that was searching
  */
  const selectOptionMember = async (idLeader: number) => {
    setShowAllTheStructure(false);
    const findDataLeader:undefined|IStructure = storeResponseSearchMember
      .find(member => member.id_member === idLeader);
    
    if(findDataLeader !== undefined) {
      await getMemberStructure(findDataLeader?.id_member);
      setLeaderIndividualStructure(findDataLeader?.id_member);
    }

    setConsultIndividualStructure(true);
    setSearchMembers([]);
    setStoreResponseSearchMember([]);
  }

  const handleShowAllStructure = async():Promise<void> => {
    setConsultIndividualStructure(false);
    setShowAllTheStructure(true)
    await getStructure();
  }

  const handleDownloadExcel = async():Promise<void> => {
    const simplifiedLevelStructure:IStructureSortedStrategyLevel[] = []
    
    //Get individual structure
    const individualStructure:IStructureSortedStrategyLevel[]
      = await getIndividualStructureSortedByLevel(leaderIndividualStructure);

    //Get current strategy
    const strategy:IStyleExcelStructure[] = await getStrategy();


    /*
      As the data is sorted "nestly", it's necessary simplify without lost
      the previous sort.
      So from have an nested array, we get an unidimensional array 
      (without lost the sort that the data previosly had)

      The first node, or position always it's going to be who the user search 
      in the searcher, in short, the first position is the leader of the
      structure.
    */
    traverseTree(individualStructure, simplifiedLevelStructure);    

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    //Define the styles and position in the Excel
    let maxSizeLetter = strategy[strategy.length - 1].cardinality_level + 11;
    let strategyLevelStartPosition = simplifiedLevelStructure[0].data.cardinality_level;
    let positionDeterminer = 0;

    for(let i = 0; i < strategy.length; i++) {
      strategy[i].fontSize = maxSizeLetter - 1;
      maxSizeLetter -= 1;

      if(strategyLevelStartPosition !== undefined) 
        if(strategy[i].cardinality_level >= strategyLevelStartPosition) {
          strategy[i].colPosition = positionDeterminer;
          positionDeterminer += 1;
        }
    }


    for(let i = 0; i < simplifiedLevelStructure.length; i++) {
      const currentMember:IStructure = simplifiedLevelStructure[i].data;
      if(limitStrategyLevelShow !== undefined) 
        if(currentMember.cardinality_level !== undefined) {
          if(currentMember.cardinality_level > limitStrategyLevelShow.cardinality_level) 
              continue;
        }
          
      const positionCol:IStyleExcelStructure|undefined = 
        strategy
        .find(strategyLevel => strategyLevel.id_strategy === currentMember.id_strategy)
      
      if(positionCol !== undefined) {
        if(positionCol.colPosition !== undefined) {
          //Slides the columns depending on the strategy level.
          const row:any[] = [];
          for(let j = 0; j < positionCol?.colPosition; j++) {
            row.push("");
          }

          //Set the information
          const {first_name, last_name, role} = currentMember;
          const membersIdentifier = `${role}: ${first_name} ${last_name}`; 
          
          row.push(membersIdentifier)

          const currentRow = worksheet.addRow(row);  
          const currentColumn = worksheet.getColumn(row.length);  
          
          currentColumn.width = membersIdentifier.length + 5;
          currentRow.font = { size: positionCol.fontSize }
          currentRow.alignment = { horizontal: 'center' }
          
        }
      }  
    }
    
  // Create a Blob object and trigger the download
    const blob = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

    const link = document.createElement('a');
    link.href = url;
    link.download = `${individualStructure[0].data.first_name}_${individualStructure[0].data.last_name}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    handleOnCloseDialog();
  }

  const handleOnCloseDialog = () => { 
    setShowDialog(false);
    setLimitStrategyLevelShow(undefined);
  }

  return(
    (viewAllStructurePrivilege === true || searchIndividualStructurePrivilege === true) ?
    <>
      <Dialog onClose={() => { handleOnCloseDialog }} open={showDialog}>
        <div className="">
          <div className="p-10 flex flex-col">
            <StrategyAutocomplete 
              onSelect={ setLimitStrategyLevelShow }
              popLastLevel={ false }
              />
            <div className="mt-10 flex flex-row justify-around">
              <Button label="Aceptar" onClick={ () => { handleDownloadExcel() } }/>
              <Button label="Cancelar" colorButton={1} onClick={ handleOnCloseDialog }/>
            </div>
          </div>
        </div>
      </Dialog>
      { searchIndividualStructurePrivilege === true && 
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
      { (searchIndividualStructurePrivilege === true && consultIndividualStructure === true) &&
        <div className="absolute flex-col w-full h-full justify-center">
          <Tooltip title="Descargar la estructura del lider en excel">
            <button
              onClick={ () => setShowDialog(true) } 
              className={`z-10 absolute p-5 rounded-full hover:bg-cyan-800 bottom-0 left-0 mb-44 ml-3 ${showAllTheStructure ? "bg-cyan-800" : "bg-cyan-600"}`} >
              <div className="text-white">
                <RiFileExcel2Fill />
              </div>
            </button>
          </Tooltip>
        </div>
      }
      { viewAllStructurePrivilege === true &&
        <div className="absolute flex-col w-full h-full justify-center">
          <Tooltip title="Ver toda la estructura">
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