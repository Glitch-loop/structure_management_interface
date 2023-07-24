import {useEffect, useState} from 'react';
import OrganizationChartTable from "../components/DataVisualization/OrganizationChartTable";
import requester from "../helpers/Requester";
import Forbbiden from '../components/Authorization/Forbbiden';
import { CircularProgress } from '@mui/material';

const OrganizationChartTableVisualization = () => {
  const [access,setAccess] = useState<boolean|undefined>(undefined);

  useEffect(() => {
    requester({url: '/privileges/user/[26]', method: "GET"})
    .then(response => {
      
      setAccess(response.data.privilege)
    })
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
        { access === undefined && <CircularProgress /> }
        { access === true && <OrganizationChartTable /> }
        { access === false && <Forbbiden /> }
          
        </div>
        
    </div>
  )
}

export default OrganizationChartTableVisualization;