Distributor
==============

```
db.server_images.insert({"_id" : ObjectId("5b52060b3ecab735ff2afe9e"), imageId: 'version1', state: 'stable', 'version': 1})

db.plans.insert({planCode: 'basic', active: true, uploadsPerServer: 20, "_id" : ObjectId("5b3b4a1428e3c090e118672a")})
db.plans.insert({planCode: 'plus', active: true, uploadsPerServer: 20, "_id" : ObjectId("5b3b4a1428e3c090e118672d")})
db.plans.insert({planCode: 'premium', active: true, uploadsPerServer: 5, "_id" : ObjectId("5b3b4a9f28e3c090e118672b")})

db.servers.insert({hostname: 'localhost1', runningUploadsCount: 0, plan: ObjectId('5b3b4a1428e3c090e118672a'), state: 'running', cloudServerId: 'localhost1', version: 1, image: ObjectId('5b52060b3ecab735ff2afe9e'), currentVersion: 1})
db.servers.insert({hostname: 'localhost2', runningUploadsCount: 0, plan: ObjectId('5b3b4a1428e3c090e118672d'), state: 'running', cloudServerId: 'localhost2', version: 1, image: ObjectId('5b52060b3ecab735ff2afe9e'), currentVersion: 1})
db.servers.insert({hostname: 'localhost3', runningUploadsCount: 0, plan: ObjectId('5b3b4a9f28e3c090e118672b'), state: 'running', cloudServerId: 'localhost3', version: 1, image: ObjectId('5b52060b3ecab735ff2afe9e'), currentVersion: 1})
```

## Autoscaling algorithm:

### Case 1(Deficiency)
Suppose:
```
Servers = 2
Uploads count per server = 5
Capable uploads count = 2 * 5 = 10
Actual uploads count = 5 + 7 = 12
70% of x = 12
x = 17.17
Multiple of 5 greater than 17 = Math.ceil(17.17/5) * 5 = 4 * 5 = 20
so Servers to Add = (20 - 10) / 5 = 2
```

> serversDefieiency = (targettedUploadsCount - capableUploadsCount) / plan.uploadsPerServer

### Case 2(Excess)
Suppose:
```
Servers = 4
Uploads count per server = 5
Capable uploads count = 5 * 4 = 20
Actual uploads count = 10
65 % of x = 10
x = 16.77

Multiple of 5 greater than 16.77 = Math.ceil(16.77/5) * 5 = 4 * 5 = 20
so Servers to Reduce = (20 - 20) / 5 = 0
```


### Case 3(Excess)
Suppose:
```
Servers = 5
Uploads count per server = 8
Capable uploads count = 5 * 8 = 40
Actual uploads count = 18
65% of x = 18
x = 26.69

Multiple of 8 greater than 26.69 = 32

so Servers to Reduce = (40 - 32) / 8 = 1
```

### Case 4(Excess)
Suppose:
```
Servers = 8
Uploads count per server = 8
Capable uploads count = 8 * 8 = 64
Actual uploads count = 18
65% of x = 18
x = 26.69

Multiple of 8 greater than 26.69 = 32

so Servers to Reduce = (64 - 32) / 8 = 4
```

### Case 5(Excess)
Suppose:
```
Servers = 4
Uploads count per server = 8
Capable uploads count = 4 * 8 = 32
Actual uploads count = 9
65% of x = 9
x = 13.84

Multiple of 8 greater than 13.84 = 16

so Servers to Reduce = (32 - 16) / 8 = 2
```
