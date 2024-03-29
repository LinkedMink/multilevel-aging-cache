# Multilevel Aging Cache

![Build State](https://github.com/LinkedMink/road-wave-fm-web/actions/workflows/build-main.yml/badge.svg)
![npm version](https://badge.fury.io/js/@linkedmink%2Fmultilevel-aging-cache.svg)

This library aims to provide an interface for storing and retrieving data from a hierarchy of
commonly used persistence mechanisms. In a storage hierarchy, different storage systems are faster
than others. Specify a hierarchy and allow the system to manage reading/writing to each layer.

## Feature Summary (Some Planned)

- A cache designed for distributed systems
  - Support for multiple levels (Memory -> Distribuited Cache -> Persistence Layer)
  - Publish writes to other nodes
- Plugin storage providers
  - Memory (Built-in)
  - ioredis
  - mongodb
  - mongoose
- Varied replacement algorithms
  - None (Distributed synchronization only)
  - FIFO
  - LRU
- Persistence control
  - Cache only with no persistence
  - Require top level persistence on write
- Consistency control
  - No writes to newer values
  - Overwrite as needed

## Usage

See the [demo program](/demo/index.ts) for an example of how to use the library.

TODO add more detail

## Documentation

- [core](https://linkedmink.github.io/multilevel-aging-cache)
- [ioredis](https://linkedmink.github.io/multilevel-aging-cache/plugins/ioredis)
- [mongodb](https://linkedmink.github.io/multilevel-aging-cache/plugins/mongodb)
- [mongoose](https://linkedmink.github.io/multilevel-aging-cache/plugins/mongoose)
