import OrganizationChartTable from "../components/DataVisualization/OrganizationChartTable";

const OrganizationChartTableVisualization = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <OrganizationChartTable />
        </div>
        
    </div>
  )
}

export default OrganizationChartTableVisualization;