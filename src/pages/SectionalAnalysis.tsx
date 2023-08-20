import SectionalAnalysisComponent from "../components/Sectionals/SectionalAnalysisComponent";


const SectionalAnalysis = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
      <div className="bg-white overflow-y-auto rounded-md p-3">
        <SectionalAnalysisComponent />
      </div>
  </div>

  )
}

export default SectionalAnalysis;