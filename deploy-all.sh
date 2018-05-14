#!/bin/bash
docker build -t fleet-base .
docker build -t service_a - < _deploy/ServiceA/Dockerfile
docker build -t service_b - < _deploy/ServiceB/Dockerfile
docker build -t service_comm - < _deploy/ServiceComm/Dockerfile
kubectl apply -f _deploy/util-services.yaml
kubectl apply -f _deploy/deployment-spec.yaml