import { useEffect, useState } from 'react';
import { IStructure, IRequest } from '../interfaces/interfaces';
import requester from '../helpers/Requester';


interface NodeMember {
  data: IStructure;
  childs: NodeMember[];
}

class TreeNode {
  private root:NodeMember[];
  // private childs: NodeMember[];

  constructor() {
    this.root = [];
    // this.childs = []
  }


  /*
    The alghoritm doesn't care the cardinality level, if it detects a member that doesn't 
    a leader, that means that that members is going to be at the root of the three,
    otherwise, the leader is in the tree.

    It's important to empazhise that the "array" of members that are going to be added, 
    it must be organized ascendently take as reference point the cardinality level 
    (1, 2, 3,... n)
  */
  public addNode(newMember:IStructure):void {
    // console.log("Member to be added: ", newMember)
    const newNode:NodeMember = {
      data: newMember,
      childs: []
    }
    
    if(newMember.id_leader === null) {
      //Mean that the user doesn't have leader
      /*
        Theorically the members with highest level 
        or member without leader
      */
      // console.log("There is a member that is in the root: ", newMember)
      this.root.push(newNode)
    } else {
      // In the case of empty root
      this.addNodeRecursive(this.root, newNode);
    } 

  }

  private addNodeRecursive(currentNode: NodeMember[], child: NodeMember) {
    // console.log("There is a member that a child: ", child)
    for(let i = 0; i < currentNode.length; i++) {
      // console.log("Child leader: ", child.data.id_leader)
      // console.log(" leader: ", child.data.id_leader)
      if(currentNode[i].data.id_member === child.data.id_leader) {
        currentNode[i].childs.push(child);
      } else {
        if(currentNode[i].childs[0] !== undefined) {
          this.addNodeRecursive(currentNode[i].childs, child)
        }
      }
    }
  }
}


const MapDataView = () => {
  useEffect(() => {
    getAllMembers()
  }, [])

  const [members, setMembers] = useState<IStructure[]>([])
  const [treeMembers, setTreeMembers] = useState<any>(undefined)

  const getAllMembers = async () => { 
    const response:IRequest<IStructure[]> = await requester({
      method: 'GET',
      url: `/members`
    })
  
    if(response.data !== undefined) {
      const members = response.data;
      const tree = new TreeNode()
      // setTreeMembers(tree)
      // console.log(members)

      // let membersTree:NodeMember[] = [];

      for(let i = 0; i < members.length; i++) {
        tree.addNode(members[i]);
      }

      console.log("*************************************************")
      console.log(tree)
      // setMembers(response.data)    
      // console.log(response.data)
    }
  }

  return (
    <p>
      Hello world
    </p>
  )
}

export default MapDataView;