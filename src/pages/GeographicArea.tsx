import Map from "../components/GeographicAreas/Map"
const GeographicArea = () => {
  return (
  <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
    <div className="bg-white w-full h-full rounded-md p-3">
      <Map />      
    </div>
  </div>
  
  
  )
}

export default GeographicArea