import StructureVisualization from "../components/DataVisualization/StructureVisualization";

const DataView = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white w-full h-full rounded-md p-3">
          <StructureVisualization />
          {/* <GraphComponent /> */}
        </div>
    </div>
  )
}

export default DataView;