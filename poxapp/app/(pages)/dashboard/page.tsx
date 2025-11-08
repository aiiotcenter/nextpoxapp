"use client";
import React, { useState } from "react";
import "@/app/styles/main.css";

const vectorShowcaseStyles = `


.vector-showcase h3 {
  text-align: center;
  color: #495057;
  margin-bottom: 30px;
  font-size: 20px;
  font-weight: 600;
}

.vector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.vector-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid #6c757d;
}

.vector-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.vector-card:nth-child(1) { border-left-color: #780000; }
.vector-card:nth-child(2) { border-left-color: #780000; }
.vector-card:nth-child(3) { border-left-color: #780000; }
.vector-card:nth-child(4) { border-left-color: #780000; }
.vector-card:nth-child(5) { border-left-color: #780000; }
.vector-card:nth-child(6) { border-left-color: #780000; }

.vector-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: #f8f9fa;
}

.vector-content {
  padding: 20px;
}

.vector-name {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 10px;
}

.vector-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .vector-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .vector-showcase {
    padding: 20px 15px;
  }
  
  .vector-content {
    padding: 15px;
  }
  
  .vector-image {
    height: 140px;
  }
}
`;

const vectorData = {
    "Cimex_Lectularius": {
        displayName: "Cimex Lectularius",
        description: "Common bed bugs are small, reddish-brown insects that feed on human blood. They typically hide in mattresses, bed frames, and furniture crevices.",
        imageUrl: "/assets/cimex.jpg",
        precision: 0.95,
        recall: 0.96,
        f1Score: 0.96
    },
    "Pediculus_humanus_capitis": {
        displayName: "Pediculus Humanus Capitis",
        description: "Head lice are tiny parasitic insects that live on the scalp and feed on human blood. They are commonly found in school-age children.",
        imageUrl: "/assets/pediculus.jpg",
        precision: 0.94,
        recall: 0.95,
        f1Score: 0.95
    },
    "Culex_sp": {
        displayName: "Culex Mosquito",
        description: "Culex mosquitoes are common vectors for diseases like West Nile virus. They are active during evening and night hours.",
        imageUrl: "/assets/culex.jpg",
        precision: 0.94,
        recall: 0.95,
        f1Score: 0.95
    },
    "Ixodes_ricinus": {
        displayName: "Ixodes Ricinus",
        description: "Deer ticks are known vectors for Lyme disease. They are found in wooded and grassy areas and attach to hosts to feed on blood.",
        imageUrl: "/assets/ixodes.jpg",
        precision: 0.94,
        recall: 0.96,
        f1Score: 0.95
    },
    "Ctenocephalides_felis": {
        displayName: "Ctenocephalides Felis",
        description: "Cat fleas are the most common flea species affecting both cats and dogs. They can also bite humans and transmit diseases.",
        imageUrl: "/assets/felis.jpg",
        precision: 0.97,
        recall: 0.94,
        f1Score: 0.95
    },
    "Aedes": {
        displayName: "Aedes Mosquito",
        description: "Aedes mosquitoes are aggressive daytime biters known for transmitting dengue, Zika, and chikungunya viruses.",
        imageUrl: "/assets/aedes.jpg",
        precision: 0.96,
        recall: 0.93,
        f1Score: 0.94
    }
};

export default function Dashboard() {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [simulationMode, _setSimulationMode] = useState(true);
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ textAlign: "center", color: "#780000", fontSize: "40px", fontWeight: 700 }}>
                FESAT
            </h1>
            <h2 style={{ textAlign: "center", color: "#010101", fontSize: "32px", fontWeight: 500, marginBottom: "20px" }}>
                Vector Classification Application
            </h2>

            {simulationMode && (
                <div className="vector-showcase">
                    <style jsx>{vectorShowcaseStyles}</style>
                    <h3>Disease-Carrying Vectors We Identify</h3>
                    <div className="vector-grid">
                        {Object.entries(vectorData).map(([key, vector]) => (
                            <div key={key} className="vector-card">
                                <img 
                                    src={vector.imageUrl} 
                                    alt={vector.displayName}
                                    className="vector-image"
                                    onError={(e) => {
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236c757d' font-family='Arial' font-size='14'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                                    }}
                                />
                                <div className="vector-content">
                                    <div className="vector-name">{vector.displayName}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}