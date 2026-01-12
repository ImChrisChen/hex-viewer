// Vite Worker 查询后缀的类型声明
declare module '*?worker' {
  const workerConstructor: {
    new(): Worker;
  };
  export default workerConstructor;
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new(): Worker;
  };
  export default workerConstructor;
}

declare module '*?worker&url' {
  const url: string;
  export default url;
}
