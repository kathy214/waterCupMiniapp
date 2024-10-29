const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}
const inArray = (arr, key, val) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}
// ArrayBuffer转16进度字符串示例
const ab2hex = (buffer) =>{
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}
// 将十六进制字符串转换为字节数组
const hexToBytes = (hex) => {
  let bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

// 将字节数组转换为文本字符串
const bytesToString = (bytes) => {
  return String.fromCharCode.apply(null, bytes);
}

// 将文本字符串解析为对象
const parseToObject = (string) => {
  let object = JSON.parse(string);
  return object;
}

// 123456789转一二三四五六七八九
const trans = (num)=> {
  if(num <=0 ){
    return
  }
  var zh = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  var result;
  let y = num % 10;
  if(num >= 10){
    let s =  parseInt(num / 10) % 10;
    if(s > 1){
      result = zh[s] + '十' + zh[y]
    }else{
      result = '十' + zh[y]
    }
  }else{
    result = zh[y]
  }
  return result
}

module.exports = {
  formatTime,
  ab2hex,
  hexToBytes,
  bytesToString,
  inArray,
  trans
}
