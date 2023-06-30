import { useLoadScript } from "@react-google-maps/api"

import ManageGeographicAreasMapRender from "./ManageGeographicAreasMapRender"
import VisualizateGeographicArea from "./VisualizateGeographicArea" 


const Map = ({typeMap}:{typeMap:number}) => {
  console.log(import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY)
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY
  })
  if(!isLoaded) return <div>Loading...</div>
  return (
  typeMap==1 ? <ManageGeographicAreasMapRender /> :
  <VisualizateGeographicArea />
  )
}



export default Map