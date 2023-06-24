import Graphos from "../components/DataVisualization/Graphos";

const DataView = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <Graphos />
        </div>
        
    </div>
  )
}

export default DataView;