/// <reference path="../typescript_definitions/index.d.ts" />
class PatchyTopReader extends FileReader {
    topFile = null;
    system;
    elems;
    sidCounter = 0;
    nucLocalID = 0;
    lastStrand; //strands are 1-indexed in oxDNA .top files
    n3;
    callback;
    configurationLength;
    LORO;
    constructor(topFile, system, elems, callback) {
        super();
        this.topFile = topFile;
        this.system = system;
        this.elems = elems;
        this.callback = callback;
        this.LORO = false;
        if (this.topFile.name.toLowerCase().includes("loro")) {
            this.LORO = true;
        }
    }
    onload = ((f) => {
        return () => {
            let nucCount = this.elems.getNextId();
            let file = this.result;
            let lines = file.split(/[\n]+/g);
            this.configurationLength = parseInt(lines[0].split(" ")[0]);
            lines = lines.slice(1); // discard the header as we have the info now
            let speciesCounts = [];
            if (!this.LORO) {
                lines[0].split(" ").forEach((t, i) => {
                    if (t) {
                        let sphere = new PatchyParticle(nucCount + i, this.system);
                        this.system.particles.push(sphere);
                        sphere.id = i;
                        this.elems.set(nucCount + i, sphere);
                        sphere.type = t;
                        const s = parseInt(t);
                        if (speciesCounts[s] == undefined) {
                            speciesCounts[s] = 1;
                        }
                        else {
                            speciesCounts[s]++;
                        }
                        sphere.sid = speciesCounts[s] - 1;
                        sphere.clusterId = clusterCounter;
                    }
                });
            }
            else {
                lines.forEach((line, t) => {
                    console.log(line);
                    let info = line.split(" ");
                    const pcount = parseInt(info[0]);
                    for (let i = pcount * t; i < pcount * (t + 1); i++) {
                        let sphere = new PatchyParticle(nucCount + i, this.system);
                        this.system.particles.push(sphere);
                        sphere.sid = this.sidCounter++;
                        sphere.id = nucCount + i;
                        sphere.sid = i;
                        this.elems.set(nucCount + i, sphere);
                        sphere.type = t.toString();
                        // Set the id per species
                        if (speciesCounts[t] == undefined) {
                            speciesCounts[t] = 1;
                        }
                        else {
                            speciesCounts[t]++;
                        }
                        sphere.sid = speciesCounts[t] - 1;
                        sphere.clusterId = clusterCounter;
                    }
                });
            }
            nucCount = this.elems.getNextId();
            // usually the place where the DatReader gets fired
            this.callback();
        };
    })(this.topFile);
    read() {
        this.readAsText(this.topFile);
    }
}
