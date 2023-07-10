import { Options, Edge, Node, DataSet, Network } from "vis-network";
import { useEffect, useState } from "react";
import useVisNetwork from "./useVisNetwork";


const Graphos = ({
    edges, 
    nodes, 
    options,
    dataSetNodes,
    dataSetEdges
  }: {
    edges: Edge[], 
    nodes: Node[], 
    dataSetNodes: any,
    dataSetEdges: any,
    options: any,
}) => {

  //This is the first option to create the graph
  // const { ref, network } = useVisNetwork({
  //   options,
  //   edges,
  //   nodes
  // });

  //This is the second option
  const data = {nodes: dataSetNodes, edges: dataSetEdges};
  let container = document.getElementById('network');
  if(container !== null) {
    //Create the graph
    const network = new Network(container, data, options);

    //Desactivate the phisics (the animation of the nodes' movement)
    network.on('dragEnd', (event) => {
      const { nodes: draggedNodes } = event;
      if (draggedNodes.length > 0) {
        network.setOptions({ physics: false });
      }
    });
  }
  
  return(
    <>
      <div id="network" style={{ height: "100%", width: "100%" }}></div>
      {/* <div style={{ height: 600, width: "100%" }} ref={ref} /> */}
    </>
  )
}

export default Graphos;