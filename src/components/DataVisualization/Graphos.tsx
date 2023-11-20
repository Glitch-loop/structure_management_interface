import { 
  // Options, 
  Edge, 
  Node, 
  // DataSet, 
  Network } from "vis-network";
import { useEffect, useState } from "react";
// import useVisNetwork from "./useVisNetwork";


const Graphos = ({
    // edges, 
    // nodes, 
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
  /*
    This component calls to the API to make the graphs.
    We can see this component sa the engine that we use to get
    the image of the "tree" (o graph)
  */

  useEffect(() => {
    //This is the first option to create the graph
    // const { ref, network } = useVisNetwork({
    //   options,
    //   edges,
    //   nodes
    // });

    //This is the second option
    // Set nodes and edges
    const data = {nodes: dataSetNodes, edges: dataSetEdges};
    
    // Create a manipulable element to set our "image"
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

      network.on('click', (event) => {
        // const { node: clickNode } = event;
        console.log(event)
      })
    }
  }, [dataSetNodes, dataSetEdges]);

  return(
    <>
      <div id="network" style={{ height: "100%", width: "100%" }}></div>
      {/* <div style={{ height: 600, width: "100%" }} ref={ref} /> */}
    </>
  )
}

export default Graphos;