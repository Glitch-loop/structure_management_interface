import TablePersons from "../components/TablePersons/TablePersons";

const ManageCollaborator = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <TablePersons action={1}/>
        </div>
        
    </div>
  )
}

export default ManageCollaborator;