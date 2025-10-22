
import cv2
import os
import numpy as np
import matplotlib.pyplot as plt
from numpy import linalg as la
import statistics as st 
import time

poze = []
nrPersoane = 40
nrPozeAntrenare = 8
nrPozeTotale = 10
nrTotalTeste=nrPersoane*(10-nrPozeAntrenare)

A=np.zeros([10304,320])
T=np.zeros([10304,80])

path = r'C:\Users\Cezar\Desktop\Algoritmi de Calcul stintific\Lab2\att_faces'

for i in range(1,nrPersoane+1):
     personPath = path + '\s' + str(i) + '\\'
     for j in range(1,nrPozeAntrenare+1):
          personTrainingPath = personPath + str(j) + '.pgm'
          trainingPhoto = np.array(cv2.imread(personTrainingPath,0))
          trainingPhoto = trainingPhoto.reshape(10304,)
          A[:, 8*(i-1)+(j-1)] = trainingPhoto

for i in range(1,nrPersoane+1):
     personPath = path + '\s' + str(i) + '\\'
     for j in range(nrPozeAntrenare+1,nrPozeTotale+1):
          personTestPath = personPath + str(j) + '.pgm'
          testPhoto = np.array(cv2.imread(personTestPath,0))
          testPhoto = testPhoto.reshape(10304,)
          coloana = (2*(i-1)+(j-9))
          T[:,coloana] = testPhoto
     

def NN(norm,A,p):
        z = np.zeros(len(A[0]))
        for i in range(len(A[0])):
            if norm == 1:
                z[i]=la.norm(A[:,i]-p,1)
            elif norm == 2:
                z[i] = la.norm(A[:,i]-p,2)
            elif norm == 3:
                z[i] = la.norm(A[:,i]-p,np.inf)
            elif norm == 4:
                z[i] = 1 - (np.dot(A[:,i], p))/(la.norm(A[:,i],2) * la.norm(p,2))
        pozitia=np.argmin(z)
        return pozitia

def kNN(norm,A,p,k):
        z = np.zeros(len(A[0]))
        for i in range(len(A[0])):
            if norm == 1:
                z[i]=la.norm(A[:,i]-p,1)
            elif norm == 2:
                z[i] = la.norm(A[:,i]-p,2)
            elif norm == 3:
                z[i] = la.norm(A[:,i]-p,np.inf)
            elif norm == 4:
                z[i] = 1 - (np.dot(A[:,i], p))/(la.norm(A[:,i],2) * la.norm(p,2))
        indicii=np.argsort(z)[:k]
        pozitii = indicii// nrPozeAntrenare
        pozitia = st.mode(pozitii) * 8
        return pozitia



rataRecunoastereText = "Statistici NN:\n"
timpInterogareText = "Statistici NN:\n"
print("Statistici NN:")
for i in range(1,5):
    nrRecunoasteriCorecte=0 
    timpTotalInterogare=0
    for j in range(len(T[0])):
        t0 = time.perf_counter()
        persoanaTestata = j // 2
        persoanaCautata = NN(i,A,T[:,j]) // 8
        t1 = time.perf_counter()
        timpTotalInterogare += t1-t0
        if(persoanaTestata == persoanaCautata):
            nrRecunoasteriCorecte = nrRecunoasteriCorecte +1 
    rr=nrRecunoasteriCorecte/nrTotalTeste 
    print(f'Rata de recunoastere norma={i}: {rr:.8f}') 
    tmi=timpTotalInterogare/nrTotalTeste 
    print(f'Timp mediu de interogare norma={i}: {tmi:.8f}')
    rataRecunoastereText += f'Rata de recunoastere norma={i}: {rr:.8f}\n'
    timpInterogareText += f'Timp mediu de interogare norma={i}: {tmi:.8f}\n'



rataRecunoastereText += "Statistici kNN:\n"
timpInterogareText += "Statistici kNN:\n"
print("Statistici kNN:")
for k in range(1,9,2):
    for i in range(1,5):
        nrRecunoasteriCorecte=0 
        timpTotalInterogare=0
        for j in range(len(T[0])):
            t0 = time.perf_counter()
            persoanaTestata = j // 2
            persoanaCautata = kNN(i,A,T[:,j],k) // 8
            t1 = time.perf_counter()
            timpTotalInterogare += t1-t0
            if(persoanaTestata == persoanaCautata):
                nrRecunoasteriCorecte = nrRecunoasteriCorecte +1 
        rr=nrRecunoasteriCorecte/nrTotalTeste 
        print(f'Rata de recunoastere norma={i} si k={k}: {rr:.8f}') 
        tmi=timpTotalInterogare/nrTotalTeste 
        print(f'Timp mediu de interogare norma={i} si k={k}: {tmi:.8f}')
        rataRecunoastereText += f'Rata de recunoastere norma={i} si k={k}: {rr:.8f}\n'
        timpInterogareText += f'Timp mediu de interogare norma={i} si k={k}: {tmi:.8f}\n'

with open("rataRecunoastere.txt", "w", encoding="utf-8") as file:
    file.write(rataRecunoastereText)
with open("timpInterogare.txt", "w", encoding="utf-8") as file:
    file.write(timpInterogareText)