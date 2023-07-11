import { IStructure } from "../interfaces/interfaces";

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
      this.root.push(newNode)
    } else {
      // In the case of empty root
      this.addNodeRecursive(this.root, newNode);
    } 

  }

  private addNodeRecursive(currentNode: NodeMember[], child: NodeMember) {
    for(let i = 0; i < currentNode.length; i++) {
      if(currentNode[i].data.id_member === child.data.id_leader) {
        currentNode[i].childs.push(child);
      } else {
        if(currentNode[i].childs[0] !== undefined) {
          this.addNodeRecursive(currentNode[i].childs, child)
        }
      }
    }
  }

  public countStructure():number {
    let count = 0;
    for(let i = 0; i < this.root.length; i++) {
      const child:NodeMember = this.root[i];
      count += this.countRecursiveStructure(child.childs)
    }

    return count;
  }

  private countRecursiveStructure(currentNode: NodeMember[]):number {
    let count = 1;
    for(let i = 0; i < currentNode.length; i++) {
        const child:NodeMember = currentNode[i];
        count += this.countRecursiveStructure(child.childs)
    }
    return count;
  }


  /*
    If in the root is founded the member to count his followers, then, "memberFounded" variable is
    assigned true and go to recursivity... When the recursivity ends (and you get the number of
    followers that the member has), we avoid to iterate to the others "trees".
  */  
  public countMemberStructure(idMember: number|undefined):number {
    if(idMember !== undefined) {
      let count = 0;
      let memberFounded = false;
      for(let i = 0; i < this.root.length; i++) {
        
        const child:NodeMember = this.root[i];
        
        if(child.data.id_member === idMember) memberFounded = true;
  
        count += this.countMemberRecursiveStructure(child.childs, idMember, memberFounded)
  
        if (memberFounded) i = this.root.length + 1;
      }
  
      return count;
    } else return 0;
  }

  /*
  This is the recursive part of the alghoritm to count how many followers has a certain member.
  In this case if we already founded the member, then we count as if we were counted normaly the 
  tree (all the nodes below the target node are part of the sum...).

  Otherwise, if we don't still to find the node target, then we continue trying to find the node...

  In the case when were we already founded the node, we again avoid to follow iterating in the current level
  (we already have the tree that we want to found, so it isn't necessary to find in the tree).

  At the end we jut return the count that we has until now.
  */
  private countMemberRecursiveStructure(
    currentNode: NodeMember[], 
    idMember: number, 
    memberFounded: boolean):number {

      let count = 0;
      if(memberFounded) {
        count += this.countRecursiveStructure(currentNode)
      } else {
        for(let i = 0; i < currentNode.length; i++) {
          const child:NodeMember = currentNode[i];
          if(child.data.id_member === idMember) {
            memberFounded = true;
            count += this.countRecursiveStructure(child.childs)
          } else {
            count += this.countMemberRecursiveStructure(child.childs, idMember, memberFounded)
          }
          if (memberFounded) i = this.root.length + 1;
      }
    }
    return count;
  }
}

export default TreeNode;