class Common {

    getJoin(number){
        let join;
        switch(number) {
            case 1:
              join = `
              LEFT JOIN inventory inv
              ON cd.inventory_id = inv.id`;
              break;
            case 2:
              join = `
              LEFT JOIN product pr
              ON inv.product_id = pr.id`;
              break;
            case 3:
              join = `
              LEFT JOIN cart ca
              ON cd.cart_id = ca.id`;
              break;
            case 4:
              join = `
              LEFT JOIN users ur
              ON ca.user_id = ur.id `;
              break;
            default:
              join = ``;
          }
        return join;
    }

    getJoins(numbers){ // Numbers will be always an array...  i.g [2,4,1]
        let joins = '';
        for(let i = 0 ; i < numbers.length; i++){
            joins += this.getJoin(numbers[i]);
        }
        return joins;
    }

}

module.exports = new Common();