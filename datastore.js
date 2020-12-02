const {Datastore} = require('@google-cloud/datastore');

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore();
module.exports.fromDatastore = function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;

}

module.exports.sciFromDatastore = function sciFromDatastore(item){
    item.id = item[Datastore.KEY].id;
    console.log ("in sciFromDS "+ JSON.stringify(item[Datastore.KEY]))
    return item;

}
