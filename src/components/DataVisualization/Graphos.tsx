import { Options, Edge, Node, DataSet, Network } from "vis-network";
import { useEffect, useState } from "react";
import useVisNetwork from "./useVisNetwork"
import requester from "../../helpers/Requester";
import { IRequest, IStructure } from "../../interfaces/interfaces";

interface IColor {
  target: number;
  spectrum1: number;
  spectrum2: number;
  spectrum3: number;
  opactity: number;

}

const options: Options = {
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
    selectConnectedEdges: false
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
    size: 16
  },
  layout: {
    hierarchical: {
      enabled: true,
      levelSeparation: 150
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

const Graphos = () => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  useEffect(() => {
    getStructure()
    console.log("ok")


  } ,[])

  //The dara is order ascedently taken cardinality level as factor
  //Ej: 1, 2, 3, 4
  const getStructure = async () => {
    const actualStructure:IRequest<IStructure[]>  = await requester({
      url: '/data/structure'
    })

    
    if (actualStructure.data !== undefined) {
      const members:IStructure[] = getHandlerCardinalityLevelNull(actualStructure.data);
      const nodesColor:IColor[] = generateColors(members);

      const currentNodes: Node[] = [];
      const currentEdges: Edge[] = [];

      members.forEach(member => {
        const index:number = nodesColor.findIndex(nodeColor => nodeColor.target === member.cardinality_level);
        const color = `rgb(${nodesColor[index].spectrum1}, ${nodesColor[index].spectrum2}, ${nodesColor[index].spectrum2}, ${nodesColor[index].opactity})`;
        const border = `rgb(${nodesColor[index].spectrum1}, ${nodesColor[index].spectrum2}, ${nodesColor[index].spectrum2}, ${nodesColor[index].opactity+0.5})`;
        currentNodes.push({
          id: member.id_member, 
          label: `${member.first_name} ${member.last_name} \n${member.role}`,
          level: member.cardinality_level,
          color: {
            background: color,
            border: "black"
          },
          borderWidth: 1
        })

        if( member.id_leader !== undefined &&  member.id_leader !== null) {
          currentEdges.push({ 
            from: member.id_member, 
            to: member.id_leader,
            color: 'black'
          })
        }
      })

      setNodes(currentNodes)
      setEdges(currentEdges)
      // console.log("Nodes: ", currentNodes)
      // console.log("Edges: ", currentEdges)
    }
  }


  // generateNetwork = async() => {

  // }
  console.log("momentum", edges)
  console.log("bruh", nodes)
  const { ref, network } = useVisNetwork({
    options,
    edges,
    nodes
  });
  return(
    <>
      {/* <button onClick={handleClick}>Focus</button> */}
      <div style={{ height: 700, width: "100%" }} ref={ref} />
    </>
  )
}

export default Graphos;