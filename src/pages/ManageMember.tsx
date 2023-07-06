import TablePersons from "../components/TablePersons/TablePersons";

const ManageMember = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <TablePersons action={0}/>
        </div>
        
    </div>
  )
}

export default ManageMember;