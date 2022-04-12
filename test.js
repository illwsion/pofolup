
let x = 1;


function delay(){
  console.log("2");
  return 3;
}

async function testfunc(){

  let x = 1;

  console.log("1");

  x = delay();


  console.log("3");
  console.log(x);

}

testfunc();
