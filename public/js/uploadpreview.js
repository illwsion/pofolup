function captureProf(){
  html2canvas(document.getElementById("main_capture"),{
    allowTaint: false,
    useCORS: true
  }).then(canvas => {
    saveAs(canvas.toDataURL("image/jpg"), "profile.jpg");
  });
  function saveAs(url, filename){
    var link = document.createElement('a');
    if (typeof link.download === 'string'){
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else{
      window.open(url);
    }
  }
};
