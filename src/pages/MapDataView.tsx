
import Map from '../components/GeographicAreas/Map';

const MapDataView = () => {

  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
      <div className="bg-white w-full h-full rounded-md p-3">
        <Map typeMap={2}/>      
      </div>
    </div>
  )
}

export default MapDataView;