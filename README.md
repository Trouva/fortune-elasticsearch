fortune-elasticsearch
=====================


## TODO

- integrate with [elasticsearch.js](https://github.com/elasticsearch/elasticsearch-js)
- Methods to implement:
    - create
    - update
    - delete
    - findMany

- Manage relationships without explicit:

```js
var relation = [{
    type: 'library',
    singular: true
},
{
    type: 'book',
    singular: false
}]
```

