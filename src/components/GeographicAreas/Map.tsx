import { useLoadScript } from "@react-google-maps/api"

import ManageGeographicAreasMapRender from "./ManageGeographicAreasMapRender"
 

const Map = ( ) => {
  console.log(import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY)
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY
  })
  if(!isLoaded) return <div>Loading...</div>
  return <ManageGeographicAreasMapRender />
}



export default Map