const fs = require("fs")

class jsonFixer{
    constructor(filePath, fieldNameList, fieldTypeList, faultyCharacterList, correctCharacterList){
        this.fixedFileName = this.setFixedFileName(filePath)
        this.database = this.setDatabase(filePath)
        this.fieldTypeMapper = this.setFieldTypeMapper(fieldNameList, fieldTypeList)
        this.faultyCharToCharMapper = this.setCorrectCharMapper(faultyCharacterList, correctCharacterList)
        this.typeConverterMapper = new Map([['string',String],['number',Number]])
    }

    setFixedFileName(fileName){
        return fileName.replace("rawJSON/broken","fixed")
    }

    setDatabase(filePath){
        return JSON.parse(fs.readFileSync(filePath))
    }

    setFieldTypeMapper(fieldNameList, fieldTypeList){
        if (fieldNameList.length != fieldTypeList.length){
            console.log("A quantidade de campos deve ser a mesma que a quantidade tipos.\n")
            return
        }

        let fieldTypeMap = new Map()
        for(let counter = 0; counter < fieldNameList.length; counter++){
            fieldTypeMap.set(fieldNameList[counter], fieldTypeList[counter])
        }
        return fieldTypeMap
    }

    setCorrectCharMapper(faultyCharacterList, correctCharacterList){
        if (faultyCharacterList.length != correctCharacterList.length){
            console.log("A quantidade de caracteres a serem substituídos deve ser a mesma que a quantidade de caracteres pelos quais substituir.\n")
            return
        }

        let faultyCharToCharMap = new Map()
        for(let counter = 0; counter < faultyCharacterList.length; counter++){
            faultyCharToCharMap.set(faultyCharacterList[counter], correctCharacterList[counter])
        }
        return faultyCharToCharMap
    }

    iterateAndFix(){
        if(this.fixedFileName && this.database && this.faultyCharToCharMapper && this.fieldTypeMapper){
            this.database.forEach((jsonObject) => {
                this.setCorrectTypeAndChar(jsonObject)
            })

            this.exportJSON()
            return
        }
        console.log('Verifique os campos passados ao contrutor.\n')

    }

    setCorrectTypeAndChar(jsonObject){
        Object.entries(jsonObject).forEach(([fieldName, fieldValue]) => {
            console.log('Before: ', fieldValue, typeof fieldValue)
            fieldValue = this.fixFaultyChar(fieldValue)
            jsonObject[fieldName] = fieldValue
            jsonObject[fieldName] = this.fixFieldType(fieldName, fieldValue)
            console.log('After: ', jsonObject[fieldName], typeof jsonObject[fieldName])

        })
    }

    fixFaultyChar(fieldValue){
        if(typeof fieldValue != 'string'){
            return fieldValue
        }
        
        let fieldValueBuffer = [...fieldValue]
        for(let charIndex = 0; charIndex < fieldValue.length; charIndex++){
            if(this.faultyCharToCharMapper.get(fieldValueBuffer[charIndex])){
                fieldValueBuffer[charIndex] = this.faultyCharToCharMapper.get(fieldValueBuffer[charIndex])
            }
        }
        return fieldValueBuffer.join("")
    }

    fixFieldType(fieldName, fieldValue){
        var correctType = this.fieldTypeMapper.get(fieldName)

        if(typeof fieldValue != correctType){
            try{
                return this.typeConverterMapper.get(correctType)(fieldValue) 
            } catch(exception){
                console.log(`Campo \'${fieldName}\' pertence ao objeto mas não foi passado ou seu tipo está incorreto\n`)
            }
        }
        
        return fieldValue
    }

    exportJSON(){
        fs.writeFileSync("fixedJSON/" + this.fixedFileName, JSON.stringify(this.database))
    }
}

fixedDatabase_1 = new jsonFixer("rawJSON/broken_database_1.json", ["data","id_marca_", "vendas","valor_do_veiculo","nome"], ['string','number','number','number','string'],["æ","ø"],["a","o"])
fixedDatabase_1.iterateAndFix()
fixedDatabase_2 = new jsonFixer("rawJSON/broken_database_2.json", ["id_marca", "marca"], ['number','string'],["æ","ø"],["a","o"])
fixedDatabase_2.iterateAndFix()

/*

CREATE TABLE dados_completos as
SELECT fixed_database_1.c1 as "data", fixed_database_1.c2 as "id", fixed_database_1.c3 as "vendas", fixed_database_1.c4 as "valor", fixed_database_1.c5 as "veiculo_nome", fixed_database_2.c2 AS "marca"
From fixed_database_1
Join fixed_database_2
on fixed_database_1.c2 = fixed_database_2.c1; 


SELECT veiculo_nome, SUM(valor*vendas) AS receita
FROM dados_completos
GROUP BY veiculo_nome
ORDER by receita DESC
LIMIT 3;


SELECT 
(valor/10000)*10000 as inicio_da_faixa,
(valor/10000)*10000 + 9999 as final_da_faixa,
sum(vendas) as num_de_vendas
from dados_completos
group by inicio_da_faixa, final_da_faixa
order by num_de_vendas DESC

SELECT marca,
sum(valor)/sum(vendas) as ticket_medio,
sum(valor*vendas) as receita
from dados_completos
group by marca 
order by ticket_medio ASC


SELECT marca,
sum(valor)/sum(vendas) as ticket_medio,
sum(valor*vendas) as receita
from dados_completos
group by marca 
order by ticket_medio ASC

receita por ticket médio, maiores receitas:

SELECT marca,
sum(valor)/sum(vendas) as ticket_medio,
sum(valor*vendas) as receita
from dados_completos
group by marca 
order by receita ASC


select veiculo_nome, vendas, marca, valor
from dados_completos
group by veiculo_nome
order by vendas DESC


*/