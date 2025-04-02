import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Server, Database, Circle, RefreshCw, ChevronRight, Copy, Upload, AlertCircle, Route, Zap, Sailboat, ChartArea, Mail, MessageSquare, AlarmClockCheck, Briefcase, Cuboid, Globe, ChartSpline, Telescope } from 'lucide-react';
import { ENV, START_SCRIPT, YAML } from './templates';
import { downloadFile, templatize } from './util';

// Type definitions
interface Position {
  x: number;
  y: number;
}

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  ports: number[];
  supportsHTTPLB: boolean;
  dockerProfile:string|string[];
}

interface ServiceDependency {
  from: string;
  to: string;
}
interface ConfigFile {
    name: string;
    generate:(x:ServerData|LoadBalancer,type:'server'|'lb') => string;

}
interface ServerData {
  id?: string;
  name: string;
  ipAddress: string;
  cpu: number;
  ram: number;
  disk: number;
  services: string[];
  position: Position;
}
interface LoadBalancer {
    id?: string;
    name: string;
    ipAddress: string;
    cpu: number;
    ram: number;
    disk: number;
    services: string[];
    position: Position;
}

interface ConnectionService {
  from: string;
  to: string;
}

interface Connection {
  from: number;
  fromType: 'lb'|'server';
  to: number;
  toType:'lb'|'server';
  services: ConnectionService[];
}
  // Define service dependencies
  const serviceDependencies: ServiceDependency[] = [
    { from: 'ivivaweb', to: 'sqlserver' },
    { from: 'ivivaweb', to: 'mongodb' },
    { from: 'ivivaweb', to: 'influxdb' },
    { from: 'ivivaweb', to: 'redis' },
    { from: 'ivivaweb', to: 'queryengine' },
    { from: 'ivivaweb', to: 'ums' },
    { from: 'ivivaweb', to: 'reportengine' },
    { from: 'ivivaweb', to: 'lucy' },

    { from: 'lucy', to: 'sqlserver' },
    { from: 'lucy', to: 'mongodb' },
    { from: 'lucy', to: 'influxdb' },
    { from: 'lucy', to: 'redis' },
    { from: 'lucy', to: 'queryengine' },
    { from: 'lucy', to: 'ums' },
    { from: 'lucy', to: 'reportengine' },


    { from: 'ibmsinterface', to: 'sqlserver' },
    { from: 'ibmsinterface', to: 'ivivaweb' },
    { from: 'ibmsinterface', to: 'redis' },


    { from: 'jobrunner', to: 'sqlserver' },
    { from: 'jobrunner', to: 'mongodb' },
    { from: 'jobrunner', to: 'influxdb' },
    { from: 'jobrunner', to: 'redis' },

    { from: 'taskrunner', to: 'sqlserver' },
    { from: 'taskrunner', to: 'mongodb' },
    { from: 'taskrunner', to: 'influxdb' },
    { from: 'taskrunner', to: 'redis' },
    
    { from: 'emailgateway', to: 'sqlserver' },


    { from: 'smsgateway', to: 'sqlserver' },

    { from: 'queryengine', to: 'sqlserver' },
    { from: 'queryengine', to: 'mongodb' },
    { from: 'queryengine', to: 'influxdb' },
    { from: 'queryengine', to: 'redis' },
    { from: 'queryengine', to: 'lucy' },


    { from: 'reportengine', to: 'lucy' },

    { from: 'sailboat', to: 'lucy' },

    { from: 'ums', to: 'lucy' },
    { from: 'ums', to: 'influxdb' },
    { from: 'ums', to: 'mongodb' },
  ];
  const availableServices: Service[] = [
    { id: 'sqlserver', name: 'SQL Server', icon: <Database size={16} />,ports:[1433] , supportsHTTPLB: false, dockerProfile:'mssql'},
    { id: 'redis', name: 'Redis', icon: <Database size={16} /> ,ports:[6379], supportsHTTPLB: false, dockerProfile:'redis'},
    { id: 'mongodb', name: 'MongoDB', icon: <Database size={16} />,ports:[27017] , supportsHTTPLB: false, dockerProfile:'mongo'},
    { id: 'influxdb', name: 'InfluxDB', icon: <ChartSpline size={16} /> ,ports:[8086], supportsHTTPLB: false, dockerProfile:'influx'},
    { id: 'ivivaweb', name: 'ivivaweb', icon: <Globe size={16} /> ,ports:[5000], supportsHTTPLB: true, dockerProfile:'ivivaweb'},
    { id: 'lucy', name: 'Lucy Engine', icon: <Cuboid size={16} /> ,ports:[9090,9111], supportsHTTPLB: true, dockerProfile:'lucyengine'},
    { id: 'ibmsinterface', name: 'IBMS Interface', icon: <Circle size={16} /> ,ports:[], supportsHTTPLB: false, dockerProfile:'ibmsinterfacecore'},
    { id: 'jobrunner', name: 'Job Runner', icon: <Briefcase size={16} /> ,ports:[], supportsHTTPLB: false, dockerProfile:'jobrunner'},
    { id: 'taskrunner', name: 'Task Runner', icon: <AlarmClockCheck size={16} /> ,ports:[], supportsHTTPLB: false, dockerProfile:'sdtaskrunner'},
    { id: 'emailgateway', name: 'Email Gateway', icon: <Mail size={16} /> ,ports:[], supportsHTTPLB: false, dockerProfile:'emailgateway'},
    { id: 'smsgateway', name: 'SMS Gateway', icon: <MessageSquare size={16} /> ,ports:[], supportsHTTPLB: false, dockerProfile:''},
    { id: 'queryengine', name: 'Data Explorer', icon: <Telescope size={16} /> ,ports:[21003], supportsHTTPLB: true, dockerProfile:'queryengine'},
    { id: 'reportengine', name: 'Reporting Service', icon: <ChartArea size={16} /> ,ports:[21002], supportsHTTPLB: true, dockerProfile:'boldreports'},
    { id: 'sailboat', name: 'Sailboat (MQTT)', icon: <Sailboat size={16} /> ,ports:[], supportsHTTPLB: false, dockerProfile:''},
    { id: 'ums', name: 'UMS', icon: <Zap size={16} /> ,ports:[22314,5122], supportsHTTPLB: true, dockerProfile:['ums','umsapp']},

  ];
function checkForErrors(servers:ServerData[]):Array<string> {
    let errors:string[] = [];
    let sqlServers = servers.filter(s=>s.services.includes('sqlserver'));
    if (sqlServers.length>1) {
        errors.push('Only one SQL Server is supported. You have ' + sqlServers.length + ' services.');
    }
    if (sqlServers.length==0) {
        errors.push('One SQL Server is required');
    }

    let redisServers = servers.filter(s=>s.services.includes('redis'));
    if (redisServers.length==0) {
        errors.push('You need at least one Redis service');
    }

    let mongoServers = servers.filter(s=>s.services.includes('mongodb'));
    if (mongoServers.length==0) {
        errors.push('You need at least one MongoDB service');
    }
    let influxServers = servers.filter(s=>s.services.includes('influxdb'));
    if (influxServers.length==0) {
        errors.push('You need at least one InfluxDB service');
    }
    if (influxServers.length > 1) {
        errors.push('Only one InfluxDB is supported. You have ' + influxServers.length + ' services.');
    }
    let lucyServers = servers.filter(s=>s.services.includes('lucy'));
    if (lucyServers.length==0) {
        errors.push('You need at least one Lucy Engine service');
    }
    let ivivawebServers = servers.filter(s=>s.services.includes('ivivaweb'));
    if (ivivawebServers.length==0) {
        errors.push('You need at least one ivivaweb service');
    }
    let jobrunnerServers = servers.filter(s=>s.services.includes('jobrunner'));
    if (jobrunnerServers.length==0) {
        errors.push('You need at least one Job Runner service');
    }
    let taskrunnerServers = servers.filter(s=>s.services.includes('taskrunner'));
    if (taskrunnerServers.length==0) {
        errors.push('You need at least one Task Runner service');
    }
    let emailgatewayServers = servers.filter(s=>s.services.includes('emailgateway'));
    if (emailgatewayServers.length==0) {
        errors.push('You need at least one Email Gateway service');
    }
    let reportengineServers = servers.filter(s=>s.services.includes('reportengine'));
    if (reportengineServers.length==0) {
        errors.push('You need at least one Reporting Service');
    }
    return errors;

};
const ServerAllocationDashboard: React.FC = () => {
  // Define available services
  


  function loadPreset(p:string) {
    let serverName = '';
    let services:string[] = [];
    switch(p.toLocaleLowerCase()) {
    default:
    case "custom":
        break;
    case "webonly":
        serverName = 'Web Server';
        services = ['ivivaweb'];
        break;
    case "web":
        serverName = 'Web Server';
        services = ['ivivaweb','lucy'];
        break;
    case "ibms-app":
        serverName = 'App Server';
        services = ['ibmsinterface','ivivaweb'];
        break;
    case "app":
        serverName = 'App Server';
        services = ['jobrunner','taskrunner','emailgateway','smsgateway'];
        break;
    case "worker":
        serverName = 'Worker Server';
        services = ['queryengine','sailboat','reportengine','reportengine'];
        break;
    case "sqlserver":
        serverName = 'Sql Server';
        services = ['sqlserver'];
        break;
    case "db":
        serverName = 'DB Server';
        services = ['influxdb','redis','mongodb'];
        break;
    case "ums":
        serverName = 'UMS Server';
        services = ['ums'];
        break;
    }
    if (serverName && services.length>0) {
        setNewServer({...newServer,name:serverName,services:services});
    }

  }
  // State for servers
  const [servers, setServers] = useState<ServerData[]>([]);
  const [lbs,setLBs] = useState<LoadBalancer[]>([]);
  const [errors, setErrors] = useState<string[]>([]); // State to store errors
  const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false); // State to toggle error popup
  const [showNewLBForm, setShowNewLBForm] = useState<boolean>(false);
  const [showNewServerForm, setShowNewServerForm] = useState<boolean>(false);
  const [newServer, setNewServer] = useState<ServerData>({
    name: '',
    ipAddress: '',
    cpu: 1,
    ram: 4,
    disk: 100,
    services: [],
    position: { x: 0, y: 0 }
  });
  const [newLB, setNewLB] = useState<LoadBalancer>({
    name: '',
    ipAddress: '',
    cpu: 1,
    ram: 4,
    disk: 100,
    services: [],
    position: { x: 0, y: 0 }
  });
  const [editingServerIndex, setEditingServerIndex] = useState<number | null>(null);
  const [editingLBIndex, setEditingLBInex] = useState<number | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dragging, setDragging] = useState<{index:number,type:'server'|'lb'} | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  
  const diagramRef = useRef<HTMLDivElement>(null);

  const handleCopyConfiguration = (): void => {
    const configuration = {
      servers,
      connections,
      lbs,
    };
    navigator.clipboard.writeText(JSON.stringify(configuration, null, 2))
      .then(() => alert('Configuration copied to clipboard!'))
      .catch(() => alert('Failed to copy configuration.'));
  };

  const handleLoadConfiguration = (json: string): void => {
    try {
      const parsedConfig = JSON.parse(json);
      if (Array.isArray(parsedConfig.servers) && Array.isArray(parsedConfig.connections) && Array.isArray(parsedConfig.lbs)) {
        setServers(parsedConfig.servers);
        setLBs(parsedConfig.lbs);
        setConnections(parsedConfig.connections);
      } else {
        alert('Invalid configuration format.');
      }
    } catch (error) {
      alert('Failed to parse JSON. Please check the input.');
    }
  };

  // Calculate server connections based on the services they host
  useEffect(() => {
    const newConnections: Connection[] = [];
    const serverServices: Record<string, number[]> = {};
    const lbMap: Record<string,number> = {};
    lbs.forEach((lb,lbi)=>{
        for(let service of lb.services) {
            lbMap[service] = lbi;
        }
    });

    //first create connections from load balancers to servers
    let si = 0;
    for(let server of servers) {
        for(let service of server.services) {
            if (lbMap[service] != undefined) {
                let ec = newConnections.find( conn => 
                    conn.from == lbMap[service] &&
                    conn.fromType == 'lb' &&
                    conn.to == si && 
                    conn.toType == 'server'
                );
                if (!ec) {
                    ec = {
                        from:lbMap[service],
                        fromType:'lb',
                        to:si,
                        toType:'server',
                        services:[],
                    };
                    newConnections.push(ec);
                }
            }
        }
        si++;
    }

    // Map services to their servers
    servers.forEach((server, serverIndex) => {
      server.services.forEach(serviceId => {
        if (!serverServices[serviceId]) serverServices[serviceId] = [];
        serverServices[serviceId].push(serverIndex);
      });
    });
    
    // Create connections based on service dependencies
    serviceDependencies.forEach(dep => {
      const fromServerIndices = serverServices[dep.from]||[];
      const toServerIndices = serverServices[dep.to]||[];
      const lbIndex = lbMap[dep.to];
      if (fromServerIndices.length != 0 &&  toServerIndices.length != 0 ) {
        // this is hooked via a load balancer
        if (lbIndex != undefined) {
            for (let fromServerIndex of fromServerIndices) {
                let ec = newConnections.find(
                    conn => conn.from === fromServerIndex && conn.to === lbIndex &&
                        conn.fromType == 'server' && conn.toType == 'lb'
                );
                if (!ec) {
                    ec = {
                        from: fromServerIndex,
                        to: lbIndex,
                        fromType: 'server',
                        toType: 'lb',
                        services: [],
                    };
                    newConnections.push(ec);
                }
                ec.services.push({ from: dep.from, to: dep.to });
                //find corresponding lb connection
                let lec = newConnections.find(conn => conn.fromType === 'lb' && conn.from === lbIndex && conn.toType == 'server' && conn.to == fromServerIndex);
                if (lec) {

                    let lecService = lec?.services?.find(x => x.from == dep.from && x.to == dep.to);
                    if (!lecService) {
                        lec.services.push({from:dep.from,to:dep.to});
                    }
                }

            }
        } else {
            for (let fromServerIndex of fromServerIndices) {

                for (let toServerIndex of toServerIndices) {
                    //direct connection
                    if (fromServerIndex != toServerIndex) {
                        const connectionExists = newConnections.some(
                            conn => conn.from === fromServerIndex && conn.to === toServerIndex &&
                                conn.fromType == 'server' && conn.toType == 'server'
                        );

                        if (!connectionExists) {
                            newConnections.push({
                                from: fromServerIndex,
                                to: toServerIndex,
                                fromType: 'server',
                                toType: 'server',
                                services: [{
                                    from: dep.from,
                                    to: dep.to
                                }]
                            });
                        } else {
                            // Add the service dependency to the existing connection
                            const existingConn = newConnections.find(
                                conn => conn.from === fromServerIndex && conn.to === toServerIndex
                            );
                            if (existingConn) {
                                existingConn.services.push({
                                    from: dep.from,
                                    to: dep.to
                                });
                            }
                        }
                    }
                }
            }
        }
      }
    
    });
    
    setConnections(newConnections);
  }, [servers, lbs, serviceDependencies]);

  // Validate servers and update errors whenever the server list changes
  useEffect(() => {
    const validationErrors = checkForErrors(servers);
    setErrors(validationErrors);
  }, [servers]);

  function getConnectionTarget(c:Connection,type:'from'|'to'):ServerData|LoadBalancer {
    if (type == 'from') {
        if (c.fromType == 'lb') {
            return lbs[c.from];
        } else {
            return servers[c.from];
        }
    } else {
        if (c.toType == 'lb') {
            return lbs[c.to];
        } else {
            return servers[c.to];
        }
    }
  }

  // Handler for adding a new server
  const handleAddServer = (): void => {
    // Set a default position in the diagram area
    const position: Position = {
      x: Math.floor(Math.random() * 400),
      y: Math.floor(Math.random() * 200)
    };
    
    if (editingServerIndex !== null) {
      // Edit existing server
      const updatedServers = [...servers];
      const currentPos = updatedServers[editingServerIndex].position || position;
      updatedServers[editingServerIndex] = { 
        ...newServer, 
        position: currentPos 
      };
      setServers(updatedServers);
      setEditingServerIndex(null);
    } else {
      // Add new server
      setServers([...servers, { 
        ...newServer, 
        id: Date.now().toString(),
        position
      }]);
    }
    
    // Reset form
    setNewServer({
      name: '',
      ipAddress: '',
      cpu: 1,
      ram: 4,
      disk: 100,
      services: [],
      position: { x: 0, y: 0 }
    });
    setShowNewServerForm(false);
  };

  const handleAddLB = (): void => {
    // Set a default position in the diagram area
    const position: Position = {
      x: Math.floor(Math.random() * 400),
      y: Math.floor(Math.random() * 200)
    };
    
    if (editingLBIndex !== null) {
      // Edit existing server
      const updatedLBs = [...lbs];
      const currentPos = updatedLBs[editingLBIndex].position || position;
      updatedLBs[editingLBIndex] = { 
        ...newLB, 
        position: currentPos 
      };
      setLBs(updatedLBs);
      setEditingLBInex(null);
    } else {
      // Add new server
      setLBs([...lbs, { 
        ...newLB, 
        id: Date.now().toString(),
        position
      }]);
    }
    
    // Reset form
    setNewLB({
      name: '',
      ipAddress: '',
      cpu: 1,
      ram: 4,
      disk: 100,
      services: [],
      position: { x: 0, y: 0 }
    });
    setShowNewLBForm(false);
  };


  // Handler for editing a server
  const handleEditServer = (index: number): void => {
    setNewServer({ ...servers[index] });
    setEditingServerIndex(index);
    setShowNewServerForm(true);
  };

  // Handler for removing a server
  const handleRemoveServer = (index: number): void => {
    const updatedServers = [...servers];
    updatedServers.splice(index, 1);
    setServers(updatedServers);
  };

  // Handler for toggling a service on a server
  const handleToggleService = (serviceId: string): void => {
    const serviceIndex = newServer.services.indexOf(serviceId);
    if (serviceIndex === -1) {
      setNewServer({
        ...newServer,
        services: [...newServer.services, serviceId]
      });
    } else {
      const updatedServices = [...newServer.services];
      updatedServices.splice(serviceIndex, 1);
      setNewServer({
        ...newServer,
        services: updatedServices
      });
    }
  };

  const handleEditLB = (index: number): void => {
    setNewLB({ ...lbs[index] });
    setEditingLBInex(index);
    setShowNewLBForm(true);
  };

  // Handler for removing a server
  const handleRemoveLB = (index: number): void => {
    const updatedLBs = [...lbs];
    updatedLBs.splice(index, 1);
    setLBs(updatedLBs);
  };

  // Handler for toggling a service on a server
  const handleToggleServiceLB = (serviceId: string): void => {
    const serviceIndex = newLB.services.indexOf(serviceId);
    if (serviceIndex === -1) {
      setNewLB({
        ...newLB,
        services: [...newLB.services, serviceId]
      });
    } else {
      const updatedServices = [...newLB.services];
      updatedServices.splice(serviceIndex, 1);
      setNewLB({
        ...newLB,
        services: updatedServices
      });
    }
  };

  // Drag start handler
  const handleDragStart = (event: React.MouseEvent, index: number,type:'server'|'lb'): void => {
    // Prevent default to avoid browser's native drag behavior
    event.preventDefault();
    
    if (diagramRef.current) {
      const serverElement = event.currentTarget as HTMLElement;
      const serverRect = serverElement.getBoundingClientRect();
      
      // Calculate the exact offset of the mouse within the server element
      setDragOffset({
        x: event.clientX - serverRect.left,
        y: event.clientY - serverRect.top
      });
      
      setDragging({index,type});
      
      // Add an active dragging class
      serverElement.classList.add('dragging');
    }
  };

  // Drag handler
  const handleDrag = (event: MouseEvent): void => {
    if (dragging !== null && diagramRef.current) {
      // Get the container boundaries
      const rect = diagramRef.current.getBoundingClientRect();
      
      // Calculate new position with the correct offset
      let x = event.clientX - rect.left - dragOffset.x;
      let y = event.clientY - rect.top - dragOffset.y;
      
      // Add boundary constraints
      const serverWidth = 300; // Width of server block
      const serverHeight = 200; // Approximate height of server block
      
      // Constrain to diagram boundaries
      x = Math.max(0, Math.min(x, rect.width - serverWidth));
      y = Math.max(0, Math.min(y, rect.height - serverHeight));
      
      let {index,type} = dragging;
      const updated:LoadBalancer[]|ServerData[] = [...(type == 'lb' ? lbs : servers)];
      // Update server position with rounding for smoother movement
    //   const updatedServers = [...servers];
      updated[index] = {
        ...updated[index],
        position: { 
          x: Math.round(x), 
          y: Math.round(y) 
        }
      };
      if (type == 'lb') {
        setLBs(updated);
      } else {
        setServers(updated);
      }
    }
  };

  // Drag end handler
  const handleDragEnd = (): void => {
    if (dragging !== null) {
        let {index,type} = dragging;
      // Remove the active dragging class from the element
      const serverElements = document.querySelectorAll('.server-block');
      if (serverElements[index]) {
        serverElements[index].classList.remove('dragging');
      }
      setDragging(null);
    }
  };

  // Effect to handle mouse move and up events
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent): void => {
      if (dragging !== null) {
        // Use requestAnimationFrame for smoother updates
        window.requestAnimationFrame(() => {
          handleDrag(event);
        });
      }
    };
    
    const handleMouseUp = (): void => {
      if (dragging !== null) {
        handleDragEnd();
      }
    };
    
    if (dragging !== null) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      // Disable text selection during drag
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [dragging, dragOffset]);

  // Interface for points used in the path generation
  interface PathPoint {
    x: number;
    y: number;
  }

  // Function to generate SVG path between servers
  const generatePath = (fromServer: ServerData|LoadBalancer, toServer: ServerData|LoadBalancer): string => {
    const serverWidth = 300;
    const serverHeight = 200;
    
    // Define connection points at the middle of each edge
    const fromPoints: PathPoint[] = [
      { x: fromServer.position.x + serverWidth/2, y: fromServer.position.y }, // top
      { x: fromServer.position.x + serverWidth, y: fromServer.position.y + serverHeight/2 }, // right
      { x: fromServer.position.x + serverWidth/2, y: fromServer.position.y + serverHeight }, // bottom
      { x: fromServer.position.x, y: fromServer.position.y + serverHeight/2 } // left
    ];
    
    const toPoints: PathPoint[] = [
      { x: toServer.position.x + serverWidth/2, y: toServer.position.y }, // top
      { x: toServer.position.x + serverWidth, y: toServer.position.y + serverHeight/2 }, // right
      { x: toServer.position.x + serverWidth/2, y: toServer.position.y + serverHeight }, // bottom
      { x: toServer.position.x, y: toServer.position.y + serverHeight/2 } // left
    ];
    
    // Find the center points of both servers
    const fromCenter: PathPoint = {
      x: fromServer.position.x + serverWidth/2,
      y: fromServer.position.y + serverHeight/2
    };
    
    const toCenter: PathPoint = {
      x: toServer.position.x + serverWidth/2,
      y: toServer.position.y + serverHeight/2
    };
    
    // Determine which edge points to use based on relative positions
    let fromPoint: PathPoint, toPoint: PathPoint;
    
    // Horizontal difference is greater than vertical
    if (Math.abs(toCenter.x - fromCenter.x) > Math.abs(toCenter.y - fromCenter.y)) {
      // From server is to the left of To server
      if (fromCenter.x < toCenter.x) {
        fromPoint = fromPoints[1]; // right edge
        toPoint = toPoints[3]; // left edge
      } else {
        fromPoint = fromPoints[3]; // left edge
        toPoint = toPoints[1]; // right edge
      }
    } 
    // Vertical difference is greater than horizontal
    else {
      // From server is above To server
      if (fromCenter.y < toCenter.y) {
        fromPoint = fromPoints[2]; // bottom edge
        toPoint = toPoints[0]; // top edge
      } else {
        fromPoint = fromPoints[0]; // top edge
        toPoint = toPoints[2]; // bottom edge
      }
    }
    
    // Generate Bezier curve for smooth connection
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control points offset from the connection points
    const offset = Math.min(distance / 3, 100);
    
    // Set control points direction based on connection points used
    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
    
    // If connecting from right to left or left to right
    if ((fromPoint === fromPoints[1] && toPoint === toPoints[3]) || 
        (fromPoint === fromPoints[3] && toPoint === toPoints[1])) {
      cp1x = fromPoint.x + Math.sign(dx) * offset;
      cp1y = fromPoint.y;
      cp2x = toPoint.x - Math.sign(dx) * offset;
      cp2y = toPoint.y;
    } 
    // If connecting from top to bottom or bottom to top
    else {
      cp1x = fromPoint.x;
      cp1y = fromPoint.y + Math.sign(dy) * offset;
      cp2x = toPoint.x;
      cp2y = toPoint.y - Math.sign(dy) * offset;
    }
    
    return `M ${fromPoint.x} ${fromPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPoint.x} ${toPoint.y}`;
  };
  let serviceMap:any = {};
  for(let s of servers) {
    for(let srv of s.services) {
        serviceMap[srv] = {ip:s.ipAddress};
    }
  }
  /* overwrite with load balancer details */
  for(let s of lbs) {
    for(let srv of s.services) {
        serviceMap[srv] = {ip:s.ipAddress};
    }
  }
  function generateEnv(s:ServerData|LoadBalancer) {
    let services = s.services;
    let e = '';
    for(let s of services) {
        e = ENV['iviva'];
        e += '\n\n' + (ENV[s]||'');
    }
    return templatize(e.trim(),{...serviceMap});
  }
  function generateIvivaConfig(s:ServerData|LoadBalancer) {
    return templatize(YAML.trim(),{...serviceMap});
  }
  function generateDockerCompose(s:ServerData|LoadBalancer) {
    return templatize(YAML.trim(),{...serviceMap});
  }
  function generateStartScript(s:ServerData|LoadBalancer) {
    let profiles = '';
    for(let srv of s.services) {
      let a = availableServices.find((x)=>x.id==srv);
      if (a) {
        let pr:string[] = [];
        if (Array.isArray(a.dockerProfile)) {
          pr = a.dockerProfile;
        } else {
          pr = [a.dockerProfile];
        }

        profiles += pr.map((x)=>` --profile ${x} `).join(' ');

      }
    }
    return templatize(START_SCRIPT.trim(),{...serviceMap,server:s,docker:{profiles}});
  }
  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">Deployment Planner</h1>

     

      <div className="flex gap-4 mb-4">
         {/* Add Server Button */}
      {(
        <button 
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded mb-4"
          onClick={() => setShowNewServerForm(true)}
        >
          <Plus size={16} className="mr-2" />
          Add Server
        </button>
      )}
       {/* Add LB Button */}
       {(
        <button 
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded mb-4"
          onClick={() => setShowNewLBForm(true)}
        >
          <Plus size={16} className="mr-2" />
          Add Load Balancer
        </button>
      )}
        <button 
          className="flex items-center px-4 py-2 bg-green-500 text-white mb-4"
          onClick={handleCopyConfiguration}
        >
          <Copy size={16} className="mr-2" />
          Copy Configuration
        </button>
        <button 
          className="flex items-center px-4 py-2 bg-yellow-500 text-white mb-4"
          onClick={() => {
            const json = prompt('Paste the JSON configuration here:');
            if (json) handleLoadConfiguration(json);
          }}
        >
          <Upload size={16} className="mr-2" />
          Load Configuration
        </button>
         {/* Error Icon and Popup */}
      {errors.length > 0 && (
        <div className="relative mb-4">
          <button
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => setShowErrorPopup(!showErrorPopup)}
          >
            <AlertCircle size={16} className="mr-2" />
            {errors.length} Error{errors.length > 1 ? 's' : ''}
          </button>
          {showErrorPopup && (
            <div className="absolute top-full mt-2 left-0 bg-white border rounded shadow-lg p-4 z-50" style={{width:'500px'}}>
              <h3 className="text-lg font-semibold mb-2">Configuration Errors</h3>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <button
                className="mt-2 px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowErrorPopup(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      </div>
      
     
      {/* New LB Form */}
      {showNewLBForm && (
        <div className=" absolute top-0 right-0 left-0 z-50 justify-center items-center  md:inset-20 shadow-xl   max-h-full      bg-gray-100 p-4 rounded mb-4">
            <div className="flex items-center mb-2">
          <h2 className="text-lg font-semibold mr-4">
            {editingLBIndex !== null ? 'Edit Load Balancer' : 'New Load Balancer'}
          </h2>
          <div className="flex-grow">
         
        </div>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1">LB Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newLB.name}
                onChange={(e) => setNewLB({ ...newLB, name: e.target.value })}
                placeholder="e.g., Production DB Server"
              />
            </div>
            
            <div>
              <label className="block mb-1">IP Address</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newLB.ipAddress}
                onChange={(e) => setNewLB({ ...newLB, ipAddress: e.target.value })}
                placeholder="e.g., 192.168.1.100"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block mb-1">CPU (cores)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newLB.cpu}
                onChange={(e) => setNewLB({ ...newLB, cpu: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            
            <div>
              <label className="block mb-1">RAM (GB)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newLB.ram}
                onChange={(e) => setNewLB({ ...newLB, ram: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            
            <div>
              <label className="block mb-1">Disk (GB)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newLB.disk}
                onChange={(e) => setNewLB({ ...newLB, disk: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Services to Load Balance</label>
            <div className="flex flex-wrap gap-2">
              {availableServices.filter((service)=>service.supportsHTTPLB).map((service) => (
                <button
                  key={service.id}
                  className={`flex items-center px-3 py-1 rounded border ${
                    newLB.services.includes(service.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white'
                  }`}
                  onClick={() => handleToggleServiceLB(service.id)}
                >
                  {service.icon}
                  <span className="ml-1">{service.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={handleAddLB}
            >
              {editingLBIndex !== null ? 'Update LB' : 'Add LB'}
            </button>
            
            <button
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => {
                setShowNewLBForm(false);
                setEditingLBInex(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* New Server Form */}
      {showNewServerForm && (
        <div className=" absolute top-0 right-0 left-0 z-50 justify-center items-center  md:inset-20 shadow-xl   max-h-full      bg-gray-100 p-4 rounded mb-4">
            <div className="flex items-center mb-2">
          <h2 className="text-lg font-semibold mr-4">
            {editingServerIndex !== null ? 'Edit Server' : 'New Server'}
          </h2>
          <div className="flex-grow">
          <select 
        className="p-2 border rounded"
        onChange={(e) => loadPreset(e.target.value)}
        value="custom"
      >
        <option value="custom">Select Preset</option>
        <option value="webonly">Web Server</option>
        <option value="web">Web Server (ivivaweb+Lucy)</option>
        <option value="ibms-app">App Server (For IBMS)</option>
        <option value="app">App Server</option>
        <option value="worker">Worker</option>
        <option value="sqlserver">Sql Server</option>
        <option value="db">Other Databases</option>
        <option value="ums">UMS</option>
      </select>
        </div>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1">Server Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="e.g., Production DB Server"
              />
            </div>
            
            <div>
              <label className="block mb-1">IP Address</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newServer.ipAddress}
                onChange={(e) => setNewServer({ ...newServer, ipAddress: e.target.value })}
                placeholder="e.g., 192.168.1.100"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block mb-1">CPU (cores)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newServer.cpu}
                onChange={(e) => setNewServer({ ...newServer, cpu: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            
            <div>
              <label className="block mb-1">RAM (GB)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newServer.ram}
                onChange={(e) => setNewServer({ ...newServer, ram: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            
            <div>
              <label className="block mb-1">Disk (GB)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newServer.disk}
                onChange={(e) => setNewServer({ ...newServer, disk: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Services</label>
            <div className="flex flex-wrap gap-2">
              {availableServices.map((service) => (
                <button
                  key={service.id}
                  className={`flex items-center px-3 py-1 rounded border ${
                    newServer.services.includes(service.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white'
                  }`}
                  onClick={() => handleToggleService(service.id)}
                >
                  {service.icon}
                  <span className="ml-1">{service.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={handleAddServer}
            >
              {editingServerIndex !== null ? 'Update Server' : 'Add Server'}
            </button>
            
            <button
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => {
                setShowNewServerForm(false);
                setEditingServerIndex(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Server Network Diagram */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Server Network Diagram</h2>
        <p className="text-sm text-gray-500 mb-3">Drag servers to rearrange the network view</p>
        <div 
          ref={diagramRef}
          className="border rounded p-4 bg-gray-50 relative overflow-hidden"
          style={{ 
            minHeight: '600px', 
            touchAction: 'none',
            backgroundImage: 'radial-gradient(circle, #f0f0f0 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* Connection lines between servers */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10, pointerEvents: 'none' }}>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4F46E5" />
              </marker>
            </defs>
            
            {connections.map((conn, idx) => {
                let from = getConnectionTarget(conn,'from');
                let to = getConnectionTarget(conn,'to');

            //   if (!servers[conn.from] || !servers[conn.to]) return null;
            if (!from || !to) return null;
              
              const path = generatePath(from,to);
              
              return (
                <g key={`conn-${idx}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow)"
                  />
                  {/* Animated dots along the path */}
                  <circle r="3" fill="#4F46E5">
                          <animateMotion
                              dur={`${2 + Math.random()}s`}
                              repeatCount="indefinite"
                              path={path}
                              calcMode="linear"
                              keyPoints="0;1"
                              keyTimes="0;1"
                          />
                  </circle>
                </g>
              );
            })}
          </svg>
          
          {/* Servers */}
          {servers.map((server, idx) => (
            <div
              key={server.id || idx}
              className={`server-block absolute border rounded p-3 bg-white shadow cursor-move ${
                (dragging?.index === idx && dragging?.type=='server') ? 'opacity-80 z-10 shadow-lg' : 'z-2'
              }`}
              style={{
                width: '300px',
                left: `${server.position.x}px`,
                top: `${server.position.y}px`,
                transition: (dragging?.index === idx && dragging?.type=='server') ? 'none' : 'all 0.15s ease-out',
                transform: (dragging?.index === idx && dragging?.type=='server') ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseDown={(e) => handleDragStart(e, idx,'server')}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <Server size={16} className="mr-1" />
                  <h3 className="font-semibold">{server.name}</h3>
                </div>
                
                <div className="flex gap-1">
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleEditServer(idx)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveServer(idx)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-2">
                {server.ipAddress}
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-xs mb-3">
                <div className="bg-gray-100 p-1 rounded text-center">
                  CPU: {server.cpu} cores
                </div>
                <div className="bg-gray-100 p-1 rounded text-center">
                  RAM: {server.ram} GB
                </div>
                <div className="bg-gray-100 p-1 rounded text-center">
                  Disk: {server.disk} GB
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="text-xs font-semibold mb-1">Services:</div>
                <div className="flex flex-wrap gap-1">
                  {server.services.map(serviceId => {
                    const service = availableServices.find(s => s.id === serviceId);
                    return service ? (
                      <div
                        key={serviceId}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                      >
                        {service.icon}
                        <span className="ml-1">{service.name}</span>
                      </div>
                    ) : null;
                  })}
                  {server.services.length === 0 && (
                    <div className="text-xs text-gray-500">No services assigned</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {lbs.map((lb, idx) => (
            <div
              key={lb.id || idx}
              className={`server-block lb-block absolute border rounded p-3 bg-white shadow cursor-move ${
                (dragging?.index === idx && dragging?.type=='lb') ? 'opacity-80 z-10 shadow-lg' : 'z-2'
              }`}
              style={{
                width: '300px',
                left: `${lb.position.x}px`,
                top: `${lb.position.y}px`,
                transition: (dragging?.index === idx && dragging?.type=='lb') ? 'none' : 'all 0.15s ease-out',
                transform: (dragging?.index === idx && dragging?.type=='lb') ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseDown={(e) => handleDragStart(e, idx,'lb')}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <Route size={16} className="mr-1" />
                  <h3 className="font-semibold">{lb.name}</h3>
                </div>
                
                <div className="flex gap-1">
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleEditLB(idx)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveLB(idx)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-2">
                {lb.ipAddress}
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-xs mb-3">
                <div className="bg-gray-100 p-1 rounded text-center">
                  CPU: {lb.cpu} cores
                </div>
                <div className="bg-gray-100 p-1 rounded text-center">
                  RAM: {lb.ram} GB
                </div>
                <div className="bg-gray-100 p-1 rounded text-center">
                  Disk: {lb.disk} GB
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="text-xs font-semibold mb-1">Services:</div>
                <div className="flex flex-wrap gap-1">
                  {lb.services.map(serviceId => {
                    const service = availableServices.find(s => s.id === serviceId);
                    return service ? (
                      <div
                        key={serviceId}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                      >
                        {service.icon}
                        <span className="ml-1">{service.name}</span>
                      </div>
                    ) : null;
                  })}
                  {lb.services.length === 0 && (
                    <div className="text-xs text-gray-500">No services assigned</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {servers.length === 0 && !showNewServerForm && lbs.length==0 && !showNewLBForm && (
            <div className="text-center py-12 text-gray-500">
              No servers configured. Click "Add Server" to get started.
            </div>
          )}
        </div>
      </div>
      
      {/* Connection Details */}
      {connections.length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="text-sm font-semibold mb-2">Server Dependencies:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            {connections.map((conn, idx) => {
                let from = getConnectionTarget(conn,'from');
                let to = getConnectionTarget(conn,'to');
              if (!from || !to) return null;
              
              return (
                <div key={idx} className="text-sm border-b pb-2">
                  <div className="font-medium">
                    {from.name} <ChevronRight className="inline" size={14} /> {to.name}
                  </div>
                  <div className="text-xs text-gray-600 pl-4">
                    {conn.services.map((svc, i) => {
                      const fromService = availableServices.find(s => s.id === svc.from)?.name;
                      const toService = availableServices.find(s => s.id === svc.to)?.name;
                      return (
                        <div key={i}>
                          {fromService} <ChevronRight className="inline" size={12} /> {toService}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Port Mappings */}
      {connections.length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="text-sm font-semibold mb-2">Port Mappings:</h3>
          <table className="table-auto w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left">From Server</th>
                <th className="border border-gray-300 px-2 py-1 text-left">To Server</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Ports</th>
              </tr>
            </thead>
            {(() => {
              const groupedConnections = connections.reduce((acc, conn) => {
                const from = getConnectionTarget(conn,'from');
                const to = getConnectionTarget(conn,'to');
                if (!from || !to) return acc;
                if (conn.fromType == 'lb') {
                    console.log('XXXX',from,to,conn.services);
                }
                conn.services.forEach((svc) => {

                  const fromService = availableServices.find((s) => s.id === svc.from);
                  const toService = availableServices.find((s) => s.id === svc.to);
                  const key = `${conn.fromType}${conn.from}-${conn.toType}${conn.to}-${toService?.ports?.join(',') || 'N/A'}`;
                    console.log('YYYY',key);
                  if (!acc[key]) {
                    acc[key] = {
                      from: from.ipAddress || from.name,
                      to:to.ipAddress ||to.name,
                      ports: toService?.ports?.join(', ') || 'N/A',
                      descriptions: [],
                    };
                  }

                  acc[key].descriptions.push(`${fromService?.name} → ${toService?.name}`);

                });

                return acc;
              }, {} as any);
              for(let lb of lbs) {

              }

              return (
                <tbody>
                  {Object.values(groupedConnections).map((group:any, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{group.from}</td>
                      <td className="border border-gray-300 px-2 py-1">{group.to}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        {group.descriptions.join('\n')}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">{group.ports}</td>
                    </tr>
                  ))}
                </tbody>
              );
            })()}
          </table>
        </div>
      )}
      {/* Scripts */}
      <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="text-sm font-semibold mb-2">Installation Scripts</h3>
          <table className="table-auto w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left">Server</th>
                <th className="border border-gray-300 px-2 py-1 text-left">IP Address</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Scripts</th>
              </tr>
            </thead>
            {(() => {
              

              return (
                <tbody>
                  {([...servers]).map((s:any, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{`${s.name}`}</td>
                      <td className="border border-gray-300 px-2 py-1">{`${s.ipAddress}`}</td>
                      <td className="border border-gray-300 px-2 py-1">
                    <a className='border border-gray-300  rounded file' onClick={()=>{
                        let content = generateEnv(s);
                        downloadFile((s.name||s.ipAddress)+'.env',content);
                    }}>.env file</a>
                     <a className='border border-gray-300  rounded file' onClick={()=>{
                        let content = generateIvivaConfig(s);
                        downloadFile((s.name||s.ipAddress)+'-iviva.config.yaml',content);
                    }}>iviva.config.yaml</a>
                       <a className='border border-gray-300  rounded file' onClick={()=>{
                        let content = generateStartScript(s);
                        downloadFile((s.name||s.ipAddress)+'-start.sh',content);
                    }}>start.sh</a>
                      </td>
                     
                    </tr>
                  ))}
                     {([...lbs]).map((s:any, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{`${s.name}`}</td>
                      <td className="border border-gray-300 px-2 py-1">{` ${s.ipAddress}`}</td>
                      <td className="border border-gray-300 px-2 py-1">{s.id}</td>
                     
                    </tr>
                  ))}
                </tbody>
              );
            })()}
          </table>
        </div>
    </div>
  );
};

export default ServerAllocationDashboard;