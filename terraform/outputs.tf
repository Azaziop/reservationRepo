output "mysql_container_id" {
  value = docker_container.mysql.id
}

output "mysql_host_port" {
  value = docker_container.mysql.ports[0].external
}
