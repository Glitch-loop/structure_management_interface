import ColonyAnalisysTable from "../components/DataVisualization/ColonyAnalisysTable";

const ColonyAnalisysTableVisualization = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <ColonyAnalisysTable />
        </div>
        
    </div>
  )
}

export default ColonyAnalisysTableVisualization;