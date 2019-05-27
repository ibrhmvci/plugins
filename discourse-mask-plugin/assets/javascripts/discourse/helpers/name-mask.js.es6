import { htmlHelper } from 'discourse-common/lib/helpers';

export function nameMask(string) {
  let str = string;
  let arr = str.split('');
  let i;
  for(i=1;i<=str.length;i++){
    arr[i]='*';
  }
  string = arr.join('');
  return string;
}

export default htmlHelper(nameMask);
